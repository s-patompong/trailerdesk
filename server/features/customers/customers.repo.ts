import { desc, eq, ilike, or } from "drizzle-orm";

import { customers, leads, notes } from "../../platform/schema/crm";
import { deals, quotes } from "../../platform/schema/sales";
import { tenantWhere } from "../../platform/tenant";

import type { customerInput } from "./customers.schemas";
import type { StaffContext } from "../../platform/context";
import type { z } from "zod";

export function findCustomers(context: StaffContext, query: string) {
  return context.db
    .select()
    .from(customers)
    .where(
      tenantWhere(
        customers.dealershipId,
        context.dealershipId,
        query
          ? or(
              ilike(customers.name, `%${query}%`),
              ilike(customers.email, `%${query}%`),
            )
          : undefined,
      ),
    )
    .orderBy(customers.name)
    .limit(200);
}
export async function findCustomer(context: StaffContext, id: string) {
  const rows = await context.db
    .select()
    .from(customers)
    .where(
      tenantWhere(
        customers.dealershipId,
        context.dealershipId,
        eq(customers.id, id),
      ),
    )
    .limit(1);
  return rows[0];
}
export async function addCustomer(
  context: StaffContext,
  input: z.infer<typeof customerInput>,
) {
  const id = crypto.randomUUID();
  await context.db
    .insert(customers)
    .values({ ...input, id, dealershipId: context.dealershipId });
  return id;
}
export async function customerHistory(context: StaffContext, id: string) {
  return {
    leads: await context.db
      .select()
      .from(leads)
      .where(
        tenantWhere(
          leads.dealershipId,
          context.dealershipId,
          eq(leads.customerId, id),
        ),
      )
      .orderBy(desc(leads.createdAt)),
    quotes: await context.db
      .select({
        id: quotes.id,
        totalCents: quotes.totalCents,
        createdAt: quotes.createdAt,
      })
      .from(quotes)
      .where(
        tenantWhere(
          quotes.dealershipId,
          context.dealershipId,
          eq(quotes.customerId, id),
        ),
      )
      .orderBy(desc(quotes.createdAt)),
    deals: await context.db
      .select()
      .from(deals)
      .where(
        tenantWhere(
          deals.dealershipId,
          context.dealershipId,
          eq(deals.customerId, id),
        ),
      )
      .orderBy(desc(deals.createdAt)),
    notes: await context.db
      .select()
      .from(notes)
      .where(
        tenantWhere(
          notes.dealershipId,
          context.dealershipId,
          eq(notes.customerId, id),
        ),
      )
      .orderBy(desc(notes.createdAt)),
  };
}
export async function addCustomerNote(
  context: StaffContext,
  customerId: string,
  body: string,
) {
  await context.db.insert(notes).values({
    id: crypto.randomUUID(),
    dealershipId: context.dealershipId,
    customerId,
    authorId: context.userId,
    body,
  });
}
