import { and, desc, eq, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { z } from "zod";

import { customers } from "../../platform/schema/crm";
import { dealership, trailers } from "../../platform/schema/inventory";
import { deals, quotes } from "../../platform/schema/sales";
import { chunks, documents } from "../../platform/schema/search";
import { tenantWhere } from "../../platform/tenant";

import type { inventoryToolInput } from "./search.schemas";
import type { StaffContext } from "../../platform/context";
import type { SQL } from "drizzle-orm";

export type SearchAudience = "public" | "sales" | "management";
const resultSchema = z.array(
  z.object({
    sourceType: z.string(),
    sourceId: z.string(),
    title: z.string(),
    content: z.string(),
  }),
);
function sourceAccess(context: StaffContext, audience: SearchAudience): SQL {
  const publicInventory =
    audience === "public"
      ? inArray(trailers.status, ["in_stock", "on_hold", "on_order"])
      : undefined;
  return sql`((${chunks.sourceType} = 'trailer' AND EXISTS (SELECT 1 FROM ${trailers} WHERE ${trailers.id} = ${chunks.sourceId} AND ${tenantWhere(trailers.dealershipId, context.dealershipId, publicInventory)})) OR (${chunks.sourceType} = 'document' AND EXISTS (SELECT 1 FROM ${documents} WHERE ${documents.id} = ${chunks.sourceId} AND ${tenantWhere(documents.dealershipId, context.dealershipId, audience !== "management" ? eq(documents.public, true) : undefined, eq(documents.status, "ready"))})))`;
}
export async function hybridSearch(
  context: StaffContext,
  audience: SearchAudience,
  query: string,
  embedding: number[],
) {
  const vector = JSON.stringify(
    z.array(z.number()).length(768).parse(embedding),
  );
  const scope = tenantWhere(
    chunks.dealershipId,
    context.dealershipId,
    sourceAccess(context, audience),
  );
  const result = await context.db.execute(sql`
    WITH scoped AS (SELECT id, source_type, source_id, title, content, embedding, search FROM ${chunks} WHERE ${scope}),
    vector_hits AS (SELECT id, row_number() OVER (ORDER BY embedding <=> ${vector}::vector) AS rank FROM scoped WHERE embedding <=> ${vector}::vector < 0.4 ORDER BY embedding <=> ${vector}::vector LIMIT 20),
    text_hits AS (SELECT id, row_number() OVER (ORDER BY ts_rank_cd(search, websearch_to_tsquery('english', ${query})) DESC) AS rank FROM scoped WHERE search @@ websearch_to_tsquery('english', ${query}) ORDER BY ts_rank_cd(search, websearch_to_tsquery('english', ${query})) DESC LIMIT 20),
    fused AS (SELECT coalesce(v.id,t.id) AS id, coalesce(1.0/(60+v.rank),0) + coalesce(1.0/(60+t.rank),0) AS score FROM vector_hits v FULL OUTER JOIN text_hits t ON v.id=t.id)
    SELECT s.source_type AS "sourceType", s.source_id AS "sourceId", s.title, s.content FROM fused f JOIN scoped s ON s.id=f.id ORDER BY f.score DESC LIMIT 6`);
  return resultSchema.parse(result.rows);
}
export function inventoryMatches(
  context: StaffContext,
  input: z.infer<typeof inventoryToolInput>,
  publicOnly: boolean,
) {
  const match = input.query
    ? or(
        ilike(trailers.make, `%${input.query}%`),
        ilike(trailers.model, `%${input.query}%`),
        ilike(trailers.size, `%${input.query}%`),
        ilike(trailers.type, `%${input.query}%`),
        ilike(trailers.description, `%${input.query}%`),
      )
    : undefined;
  return context.db
    .select({
      id: trailers.id,
      year: trailers.year,
      make: trailers.make,
      model: trailers.model,
      type: trailers.type,
      size: trailers.size,
      doorType: trailers.doorType,
      askingPriceCents: trailers.askingPriceCents,
      status: trailers.status,
      arrivedAt: trailers.arrivedAt,
      ...(context.role !== "sales" && !publicOnly
        ? { dealerCostCents: trailers.dealerCostCents }
        : {}),
    })
    .from(trailers)
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        match,
        publicOnly
          ? inArray(trailers.status, ["in_stock", "on_hold", "on_order"])
          : undefined,
        input.maxPriceCents !== undefined
          ? lte(trailers.askingPriceCents, input.maxPriceCents)
          : undefined,
        input.doorType ? eq(trailers.doorType, input.doorType) : undefined,
        input.minDaysOnLot !== undefined
          ? sql`${trailers.arrivedAt} <= now() - (${input.minDaysOnLot} * interval '1 day')`
          : undefined,
      ),
    )
    .orderBy(trailers.askingPriceCents)
    .limit(20);
}
export async function customerPurchases(context: StaffContext, query: string) {
  const matches = await context.db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(
      tenantWhere(
        customers.dealershipId,
        context.dealershipId,
        ilike(customers.name, `%${query}%`),
      ),
    )
    .limit(10);
  const purchases = [];
  for (const customer of matches) {
    const rows = await context.db
      .select({
        dealId: deals.id,
        totalCents: deals.totalCents,
        closedAt: deals.closedAt,
        trailer: sql<string>`${quotes.snapshot}->>'trailer'`,
      })
      .from(deals)
      .innerJoin(
        quotes,
        and(
          eq(quotes.id, deals.quoteId),
          tenantWhere(quotes.dealershipId, context.dealershipId),
        ),
      )
      .where(
        tenantWhere(
          deals.dealershipId,
          context.dealershipId,
          eq(deals.customerId, customer.id),
          eq(deals.status, "sold"),
        ),
      )
      .orderBy(desc(deals.closedAt))
      .limit(20);
    purchases.push({ ...customer, purchases: rows });
  }
  return purchases;
}

export async function publicStoreEnabled(context: StaffContext) {
  const rows = await context.db
    .select({ id: dealership.dealershipId })
    .from(dealership)
    .where(
      tenantWhere(
        dealership.dealershipId,
        context.dealershipId,
        eq(dealership.publicSite, true),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
