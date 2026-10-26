import { count, eq, gte, isNull, lt, ne, sql } from "drizzle-orm";

import { configuration } from "../../platform/config";
import { member, user } from "../../platform/schema/auth";
import { leads } from "../../platform/schema/crm";
import { dealership, trailers } from "../../platform/schema/inventory";
import { deals, holds } from "../../platform/schema/sales";
import { tenantWhere } from "../../platform/tenant";

import type { StaffContext } from "../../platform/context";

export async function storeTimezone(context: StaffContext) {
  const rows = await context.db
    .select({ timezone: dealership.timezone })
    .from(dealership)
    .where(tenantWhere(dealership.dealershipId, context.dealershipId))
    .limit(1);
  return rows[0]?.timezone ?? "America/Chicago";
}
export async function dashboardNumbers(context: StaffContext) {
  const timezone = await storeTimezone(context);
  const stock = await context.db
    .select({
      count: count(),
      averageDays:
        sql<number>`coalesce(avg(extract(epoch from (now() - ${trailers.arrivedAt})) / 86400), 0)`.mapWith(
          Number,
        ),
      ...(context.role === "sales"
        ? {}
        : {
            valueCents:
              sql<number>`coalesce(sum(${trailers.askingPriceCents}), 0)`.mapWith(
                Number,
              ),
          }),
    })
    .from(trailers)
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        eq(trailers.status, "in_stock"),
      ),
    );
  const newLeads = await context.db
    .select({ count: count() })
    .from(leads)
    .where(
      tenantWhere(
        leads.dealershipId,
        context.dealershipId,
        sql`${leads.createdAt} >= ((date_trunc('week', (now() at time zone ${timezone}) + interval '1 day') - interval '1 day') at time zone ${timezone})`,
      ),
    );
  const sold = await context.db
    .select({ count: count() })
    .from(deals)
    .where(
      tenantWhere(
        deals.dealershipId,
        context.dealershipId,
        sql`${deals.closedAt} >= (date_trunc('month', now() at time zone ${timezone}) at time zone ${timezone})`,
      ),
    );
  const aging = await agingInventory(context);
  const active = await context.db
    .select()
    .from(holds)
    .where(
      tenantWhere(
        holds.dealershipId,
        context.dealershipId,
        isNull(holds.releasedAt),
      ),
    )
    .orderBy(holds.expiresAt);
  return {
    inStock: stock[0]?.count ?? 0,
    agingThresholdDays: configuration(context.env).features.jobs.agingDays[0],
    averageDays: Math.round(stock[0]?.averageDays ?? 0),
    ...(context.role === "sales"
      ? {}
      : { inventoryValueCents: stock[0]?.valueCents ?? 0 }),
    newLeads: newLeads[0]?.count ?? 0,
    dealsThisMonth: sold[0]?.count ?? 0,
    aging,
    holds: active,
    timezone,
  };
}
export async function flagAgingAndStale(
  context: StaffContext,
  staleDays: number,
  agingDays: readonly [number, number, number],
) {
  await context.db
    .update(trailers)
    .set({
      agingBand: sql`CASE WHEN ${trailers.arrivedAt} <= now() - (${agingDays[2]} * interval '1 day') THEN ${agingDays[2]} WHEN ${trailers.arrivedAt} <= now() - (${agingDays[1]} * interval '1 day') THEN ${agingDays[1]} WHEN ${trailers.arrivedAt} <= now() - (${agingDays[0]} * interval '1 day') THEN ${agingDays[0]} ELSE 0 END`,
    })
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        eq(trailers.status, "in_stock"),
      ),
    );
  await context.db
    .update(leads)
    .set({
      stale: sql`${leads.updatedAt} <= now() - (${staleDays} * interval '1 day')`,
    })
    .where(
      tenantWhere(
        leads.dealershipId,
        context.dealershipId,
        ne(leads.stage, "won"),
        ne(leads.stage, "lost"),
      ),
    );
}
export function overdueHolds(context: StaffContext, now: Date) {
  return context.db
    .select()
    .from(holds)
    .where(
      tenantWhere(
        holds.dealershipId,
        context.dealershipId,
        isNull(holds.releasedAt),
        lt(holds.expiresAt, now),
      ),
    )
    .limit(200);
}
export function summaryRecipients(context: StaffContext) {
  return context.db
    .select({ email: user.email, name: user.name })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(
      tenantWhere(
        member.organizationId,
        context.dealershipId,
        sql`${member.role} in ('owner', 'manager')`,
      ),
    );
}
export async function dailySummary(
  context: StaffContext,
  date: string,
  timezone: string,
) {
  const start = sql`(${date}::date at time zone ${timezone})`;
  const end = sql`((${date}::date + interval '1 day') at time zone ${timezone})`;
  const newLeads = await context.db
    .select({ count: count() })
    .from(leads)
    .where(
      tenantWhere(
        leads.dealershipId,
        context.dealershipId,
        gte(
          leads.createdAt,
          sql`(${date}::date - interval '1 day') at time zone ${timezone}`,
        ),
        lt(leads.createdAt, start),
      ),
    );
  const expiring = await context.db
    .select({ count: count() })
    .from(holds)
    .where(
      tenantWhere(
        holds.dealershipId,
        context.dealershipId,
        isNull(holds.releasedAt),
        gte(holds.expiresAt, start),
        lt(holds.expiresAt, end),
      ),
    );
  const closed = await context.db
    .select({ count: count() })
    .from(deals)
    .where(
      tenantWhere(
        deals.dealershipId,
        context.dealershipId,
        gte(
          deals.closedAt,
          sql`(${date}::date - interval '1 day') at time zone ${timezone}`,
        ),
        lt(deals.closedAt, start),
      ),
    );
  const aging = await context.db
    .select({ count: count() })
    .from(trailers)
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        eq(trailers.status, "in_stock"),
        sql`${trailers.arrivedAt} <= now() - (${configuration(context.env).features.jobs.agingDays[0]} * interval '1 day')`,
      ),
    );
  return {
    newLeads: newLeads[0]?.count ?? 0,
    expiring: expiring[0]?.count ?? 0,
    closed: closed[0]?.count ?? 0,
    aging: aging[0]?.count ?? 0,
  };
}

async function agingInventory(context: StaffContext) {
  return await context.db
    .select({
      id: trailers.id,
      stockNumber: trailers.stockNumber,
      year: trailers.year,
      make: trailers.make,
      model: trailers.model,
      arrivedAt: trailers.arrivedAt,
      agingBand: trailers.agingBand,
    })
    .from(trailers)
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        eq(trailers.status, "in_stock"),
        sql`${trailers.arrivedAt} <= now() - (${configuration(context.env).features.jobs.agingDays[0]} * interval '1 day')`,
      ),
    )
    .orderBy(trailers.arrivedAt)
    .limit(20);
}
