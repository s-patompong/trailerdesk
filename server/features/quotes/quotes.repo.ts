import { desc, eq } from "drizzle-orm";

import { organization } from "../../platform/schema/auth";
import { dealership } from "../../platform/schema/inventory";
import { quotes } from "../../platform/schema/sales";
import { tenantWhere } from "../../platform/tenant";

import type { quoteInput, quoteSnapshot } from "./quotes.schemas";
import type { StaffContext } from "../../platform/context";
import type { Database } from "../../platform/db";
import type { DealershipId } from "../../platform/tenant";
import type { z } from "zod";

export function listQuotes(context: StaffContext) {
  return context.db
    .select({
      id: quotes.id,
      trailerId: quotes.trailerId,
      customerId: quotes.customerId,
      totalCents: quotes.totalCents,
      snapshot: quotes.snapshot,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .where(tenantWhere(quotes.dealershipId, context.dealershipId))
    .orderBy(desc(quotes.createdAt))
    .limit(100);
}
export async function findQuote(context: StaffContext, id: string) {
  const rows = await context.db
    .select()
    .from(quotes)
    .where(
      tenantWhere(quotes.dealershipId, context.dealershipId, eq(quotes.id, id)),
    )
    .limit(1);
  return rows[0];
}
export async function quoteSettings(context: StaffContext) {
  const rows = await context.db
    .select({
      storeName: organization.name,
      slug: organization.slug,
      address: dealership.address,
      phone: dealership.phone,
      taxBps: dealership.taxBps,
      docFeeCents: dealership.docFeeCents,
      deliveryFeeCents: dealership.deliveryFeeCents,
    })
    .from(dealership)
    .innerJoin(organization, eq(organization.id, dealership.dealershipId))
    .where(tenantWhere(dealership.dealershipId, context.dealershipId))
    .limit(1);
  return rows[0];
}
export async function insertQuote(
  context: StaffContext,
  input: z.infer<typeof quoteInput>,
  price: number,
  totals: { taxCents: number; totalCents: number },
  snapshot: z.infer<typeof quoteSnapshot>,
) {
  const id = crypto.randomUUID();
  const pdfToken = crypto.randomUUID();
  const rows = await context.db
    .insert(quotes)
    .values({
      ...input,
      ...totals,
      trailerPriceCents: price,
      id,
      pdfToken,
      snapshot,
      dealershipId: context.dealershipId,
      salespersonId: context.userId,
    })
    .returning();
  return rows[0];
}
export async function publicQuote(
  db: Database,
  id: DealershipId,
  token: string,
) {
  const rows = await db
    .select()
    .from(quotes)
    .where(tenantWhere(quotes.dealershipId, id, eq(quotes.pdfToken, token)))
    .limit(1);
  return rows[0];
}
