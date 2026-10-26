import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { auditLog } from "../../platform/schema/crm";
import { dealership, photos, trailers } from "../../platform/schema/inventory";
import { tenantWhere } from "../../platform/tenant";

import type {
  inventoryFilters,
  trailerEdit,
  trailerInput,
} from "./inventory.schemas";
import type { StaffContext } from "../../platform/context";
import type { z } from "zod";

const publicColumns = {
  id: trailers.id,
  vin: trailers.vin,
  stockNumber: trailers.stockNumber,
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
  lotLocation: trailers.lotLocation,
  askingPriceCents: trailers.askingPriceCents,
  status: trailers.status,
  description: trailers.description,
  arrivedAt: trailers.arrivedAt,
  version: trailers.version,
};
export async function findTrailers(
  context: StaffContext,
  filters: z.infer<typeof inventoryFilters>,
) {
  const order = {
    newest: desc(trailers.arrivedAt),
    oldest: asc(trailers.arrivedAt),
    price_low: asc(trailers.askingPriceCents),
    price_high: desc(trailers.askingPriceCents),
  };
  return context.db
    .select({
      ...publicColumns,
      coverPhotoId: sql<string | null>`${context.db
        .select({ id: photos.id })
        .from(photos)
        .where(
          tenantWhere(
            photos.dealershipId,
            context.dealershipId,
            eq(photos.trailerId, trailers.id),
          ),
        )
        .orderBy(desc(photos.cover), asc(photos.createdAt))
        .limit(1)}`,

      ...(context.role === "sales"
        ? {}
        : { dealerCostCents: trailers.dealerCostCents }),
    })
    .from(trailers)
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        filters.q
          ? or(
              ilike(trailers.make, `%${filters.q}%`),
              ilike(trailers.model, `%${filters.q}%`),
              ilike(trailers.stockNumber, `%${filters.q}%`),
              ilike(trailers.vin, `%${filters.q}%`),
              ilike(trailers.size, `%${filters.q}%`),
            )
          : undefined,
        filters.type ? eq(trailers.type, filters.type) : undefined,
        filters.status ? eq(trailers.status, filters.status) : undefined,
      ),
    )
    .orderBy(order[filters.sort])
    .limit(200);
}
export async function findTrailer(context: StaffContext, id: string) {
  const rows = await context.db
    .select({
      ...publicColumns,
      coverPhotoId: sql<string | null>`${context.db
        .select({ id: photos.id })
        .from(photos)
        .where(
          tenantWhere(
            photos.dealershipId,
            context.dealershipId,
            eq(photos.trailerId, trailers.id),
          ),
        )
        .orderBy(desc(photos.cover), asc(photos.createdAt))
        .limit(1)}`,

      ...(context.role === "sales"
        ? {}
        : { dealerCostCents: trailers.dealerCostCents }),
    })
    .from(trailers)
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        eq(trailers.id, id),
      ),
    )
    .limit(1);
  return rows[0];
}
export async function insertTrailer(
  context: StaffContext,
  input: z.infer<typeof trailerInput>,
) {
  const id = crypto.randomUUID();
  await context.db
    .insert(trailers)
    .values({ ...input, id, dealershipId: context.dealershipId });
  return id;
}
export async function changeTrailer(
  context: StaffContext,
  id: string,
  version: number,
  input: Omit<z.infer<typeof trailerEdit>, "version">,
) {
  return context.db
    .update(trailers)
    .set({ ...input, version: version + 1, updatedAt: new Date() })
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        eq(trailers.id, id),
        eq(trailers.version, version),
      ),
    )
    .returning({ id: trailers.id });
}
export async function recordInventoryAudit(
  context: StaffContext,
  id: string,
  action: string,
  details: string,
) {
  await context.db.insert(auditLog).values({
    id: crypto.randomUUID(),
    dealershipId: context.dealershipId,
    actorId: context.userId,
    recordId: id,
    action,
    details,
  });
}

export async function lockTrailer(context: StaffContext, id: string) {
  const rows = await context.db
    .select({ id: trailers.id, status: trailers.status })
    .from(trailers)
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        eq(trailers.id, id),
      ),
    )
    .for("update")
    .limit(1);
  return rows[0];
}
export async function setAvailability(
  context: StaffContext,
  id: string,
  status: "in_stock" | "on_hold" | "sold",
  onlyIf?: string,
) {
  return context.db
    .update(trailers)
    .set({
      status,
      updatedAt: new Date(),
      version: sql`${trailers.version} + 1`,
    })
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        eq(trailers.id, id),
        onlyIf ? eq(trailers.status, onlyIf) : undefined,
      ),
    )
    .returning({ id: trailers.id });
}

export async function inventoryTimezone(context: StaffContext) {
  const rows = await context.db
    .select({ timezone: dealership.timezone })
    .from(dealership)
    .where(tenantWhere(dealership.dealershipId, context.dealershipId))
    .limit(1);
  return rows[0]?.timezone ?? "America/Chicago";
}
