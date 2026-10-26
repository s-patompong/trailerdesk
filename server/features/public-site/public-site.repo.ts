import { and, asc, desc, eq, ilike, inArray, lte, or, sql } from "drizzle-orm";

import { member, organization, user } from "../../platform/schema/auth";
import { customers, leads } from "../../platform/schema/crm";
import { dealership, photos, trailers } from "../../platform/schema/inventory";
import { tenantWhere } from "../../platform/tenant";

import type { inquiryJob, publicFilters } from "./public-site.schemas";
import type { Database } from "../../platform/db";
import type { DealershipId } from "../../platform/tenant";
import type { z } from "zod";

export async function publicProfile(db: Database, id: DealershipId) {
  const rows = await db
    .select({
      phone: dealership.phone,
      address: dealership.address,
      hours: dealership.hours,
      timezone: dealership.timezone,
      hasLogo: sql<boolean>`${organization.logo} IS NOT NULL`,
    })
    .from(dealership)
    .innerJoin(organization, eq(organization.id, dealership.dealershipId))
    .where(
      tenantWhere(dealership.dealershipId, id, eq(dealership.publicSite, true)),
    )
    .limit(1);
  return rows[0];
}
export async function publicInventory(
  db: Database,
  id: DealershipId,
  filters: z.infer<typeof publicFilters>,
  trailerId?: string,
) {
  const ordering = {
    newest: desc(trailers.arrivedAt),
    price_low: asc(trailers.askingPriceCents),
    price_high: desc(trailers.askingPriceCents),
  };
  return db
    .select({
      id: trailers.id,
      year: trailers.year,
      make: trailers.make,
      model: trailers.model,
      type: trailers.type,
      size: trailers.size,
      gvwr: trailers.gvwr,
      axles: trailers.axles,
      hitchType: trailers.hitchType,
      doorType: trailers.doorType,
      color: trailers.color,
      condition: trailers.condition,
      askingPriceCents: trailers.askingPriceCents,
      status: trailers.status,
      description: trailers.description,
      coverPhotoId: sql<string | null>`${db
        .select({ id: photos.id })
        .from(photos)
        .where(
          tenantWhere(
            photos.dealershipId,
            id,
            eq(photos.trailerId, trailers.id),
          ),
        )
        .orderBy(desc(photos.cover), asc(photos.createdAt))
        .limit(1)}`,
    })
    .from(trailers)
    .where(
      tenantWhere(
        trailers.dealershipId,
        id,
        inArray(trailers.status, ["in_stock", "on_hold", "on_order"]),
        trailerId ? eq(trailers.id, trailerId) : undefined,
        filters.q
          ? or(
              ilike(trailers.make, `%${filters.q}%`),
              ilike(trailers.model, `%${filters.q}%`),
              ilike(trailers.size, `%${filters.q}%`),
            )
          : undefined,
        filters.type ? eq(trailers.type, filters.type) : undefined,
        filters.maxPrice
          ? lte(trailers.askingPriceCents, Number(filters.maxPrice) * 100)
          : undefined,
      ),
    )
    .orderBy(ordering[filters.sort])
    .limit(200);
}
export async function publicPhoto(
  db: Database,
  id: DealershipId,
  photoId: string,
) {
  const rows = await db
    .select({ key: photos.key })
    .from(photos)
    .innerJoin(
      trailers,
      and(
        eq(trailers.id, photos.trailerId),
        tenantWhere(
          trailers.dealershipId,
          id,
          inArray(trailers.status, ["in_stock", "on_hold", "on_order"]),
        ),
      ),
    )
    .where(tenantWhere(photos.dealershipId, id, eq(photos.id, photoId)))
    .limit(1);
  return rows[0];
}
export async function saveInquiry(
  db: Database,
  id: DealershipId,
  input: z.infer<typeof inquiryJob>,
) {
  const staff = await db
    .select({ id: user.id, email: user.email })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(
      tenantWhere(
        member.organizationId,
        id,
        inArray(member.role, ["owner", "manager", "sales"]),
      ),
    )
    .orderBy(
      sql`CASE ${member.role} WHEN 'sales' THEN 0 WHEN 'manager' THEN 1 ELSE 2 END`,
      member.createdAt,
    )
    .limit(1);
  const assigned = staff[0];
  if (!assigned)
    throw new Error(
      "This dealership has no salesperson to receive an inquiry.",
    );
  const lead = await db.transaction(async (tx) => {
    await tx
      .insert(customers)
      .values({
        id: crypto.randomUUID(),
        dealershipId: id,
        name: input.name,
        email: input.email,
        phone: input.phone,
      })
      .onConflictDoNothing();
    const matches = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        tenantWhere(
          customers.dealershipId,
          id,
          eq(customers.email, input.email),
        ),
      )
      .limit(1);
    const customer = matches[0];
    if (!customer) throw new Error("The customer could not be matched.");
    await tx
      .insert(leads)
      .values({
        id: crypto.randomUUID(),
        dealershipId: id,
        customerId: customer.id,
        trailerId: input.trailerId,
        assignedTo: assigned.id,
        stage: "new",
        message: `${inquiryTitle(input.intent)}\n${input.message}`,
        sourceKey: input.requestId,
      })
      .onConflictDoNothing();
    const rows = await tx
      .select()
      .from(leads)
      .where(
        tenantWhere(
          leads.dealershipId,
          id,
          eq(leads.sourceKey, input.requestId),
        ),
      )
      .limit(1);
    return rows[0];
  });
  if (!lead) throw new Error("The inquiry could not be saved.");
  return { lead, assigned };
}

function inquiryTitle(intent: z.infer<typeof inquiryJob>["intent"]): string {
  if (intent === "availability") return "Is this still available?";
  if (intent === "quote") return "Request a quote";
  return "Website inquiry";
}

export function publicPhotos(
  db: Database,
  id: DealershipId,
  trailerId: string,
) {
  return db
    .select({ id: photos.id, cover: photos.cover })
    .from(photos)
    .where(
      tenantWhere(photos.dealershipId, id, eq(photos.trailerId, trailerId)),
    )
    .orderBy(desc(photos.cover), asc(photos.createdAt));
}
