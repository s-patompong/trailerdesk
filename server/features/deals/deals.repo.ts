import { desc, eq, isNull } from "drizzle-orm";

import { auditLog } from "../../platform/schema/crm";
import { deals } from "../../platform/schema/sales";
import { tenantWhere } from "../../platform/tenant";

import type { StaffContext } from "../../platform/context";

export function listDeals(context: StaffContext) {
  return context.db
    .select()
    .from(deals)
    .where(tenantWhere(deals.dealershipId, context.dealershipId))
    .orderBy(desc(deals.createdAt))
    .limit(100);
}
export async function findDeal(context: StaffContext, id: string) {
  const rows = await context.db
    .select()
    .from(deals)
    .where(
      tenantWhere(deals.dealershipId, context.dealershipId, eq(deals.id, id)),
    )
    .limit(1);
  return rows[0];
}
export async function dealForQuote(context: StaffContext, quoteId: string) {
  const rows = await context.db
    .select()
    .from(deals)
    .where(
      tenantWhere(
        deals.dealershipId,
        context.dealershipId,
        eq(deals.quoteId, quoteId),
      ),
    )
    .limit(1);
  return rows[0];
}
export async function dealForTrailer(context: StaffContext, trailerId: string) {
  const rows = await context.db
    .select()
    .from(deals)
    .where(
      tenantWhere(
        deals.dealershipId,
        context.dealershipId,
        eq(deals.trailerId, trailerId),
      ),
    )
    .limit(1);
  return rows[0];
}
export async function insertDeal(
  context: StaffContext,
  input: {
    quoteId: string;
    trailerId: string;
    customerId: string;
    totalCents: number;
  },
) {
  const id = crypto.randomUUID();
  await context.db.insert(deals).values({
    ...input,
    id,
    dealershipId: context.dealershipId,
    salespersonId: context.userId,
    workflowId: id,
  });
  return id;
}
export async function closeDealRow(
  context: StaffContext,
  id: string,
  actorId: string,
  trailerId: string,
) {
  const rows = await context.db
    .update(deals)
    .set({
      status: "sold",
      closedAt: new Date(),
      progress: "Trailer marked sold",
    })
    .where(
      tenantWhere(
        deals.dealershipId,
        context.dealershipId,
        eq(deals.id, id),
        isNull(deals.closedAt),
      ),
    )
    .returning({ id: deals.id });
  if (rows.length)
    await context.db.insert(auditLog).values({
      id: crypto.randomUUID(),
      dealershipId: context.dealershipId,
      actorId,
      action: "deal.closed",
      recordId: id,
      details: JSON.stringify({ trailerId }),
    });
}
export async function saveProgress(
  context: StaffContext,
  id: string,
  progress: string,
  billKey?: string,
) {
  await context.db
    .update(deals)
    .set({ progress, ...(billKey ? { billKey } : {}) })
    .where(
      tenantWhere(deals.dealershipId, context.dealershipId, eq(deals.id, id)),
    );
}
