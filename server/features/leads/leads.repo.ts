import { and, desc, eq, ilike, or } from "drizzle-orm";

import { member, user } from "../../platform/schema/auth";
import { customers, leads, notes } from "../../platform/schema/crm";
import { tenantWhere } from "../../platform/tenant";

import type { leadInput, leadUpdate } from "./leads.schemas";
import type { StaffContext } from "../../platform/context";
import type { z } from "zod";

export function staffOptions(context: StaffContext) {
  // Organization membership belongs to Better Auth's global identity schema.
  return context.db
    .select({ id: user.id, name: user.name, role: member.role })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, context.dealershipId))
    .orderBy(user.name);
}
export function findLeads(context: StaffContext, query: string) {
  return context.db
    .select({
      id: leads.id,
      customerId: leads.customerId,
      customerName: customers.name,
      email: customers.email,
      trailerId: leads.trailerId,
      stage: leads.stage,
      message: leads.message,
      assignedTo: leads.assignedTo,
      stale: leads.stale,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
    })
    .from(leads)
    .innerJoin(
      customers,
      and(
        eq(customers.id, leads.customerId),
        tenantWhere(customers.dealershipId, context.dealershipId),
      ),
    )
    .where(
      tenantWhere(
        leads.dealershipId,
        context.dealershipId,
        query
          ? or(
              ilike(customers.name, `%${query}%`),
              ilike(customers.email, `%${query}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(leads.updatedAt))
    .limit(200);
}
export async function findLead(context: StaffContext, id: string) {
  const rows = await context.db
    .select()
    .from(leads)
    .where(
      tenantWhere(leads.dealershipId, context.dealershipId, eq(leads.id, id)),
    )
    .limit(1);
  return rows[0];
}
export async function updateLeadRow(
  context: StaffContext,
  id: string,
  input: z.infer<typeof leadUpdate>,
) {
  await context.db
    .update(leads)
    .set({ ...input, stale: false, updatedAt: new Date() })
    .where(
      tenantWhere(leads.dealershipId, context.dealershipId, eq(leads.id, id)),
    );
}
export async function addLead(
  context: StaffContext,
  input: z.infer<typeof leadInput>,
) {
  const id = crypto.randomUUID();
  await context.db.insert(leads).values({
    ...input,
    id,
    dealershipId: context.dealershipId,
    sourceKey: `staff:${id}`,
  });
  return { id };
}
export function leadNotes(context: StaffContext, id: string) {
  return context.db
    .select()
    .from(notes)
    .where(
      tenantWhere(
        notes.dealershipId,
        context.dealershipId,
        eq(notes.leadId, id),
      ),
    )
    .orderBy(desc(notes.createdAt));
}
export async function addLeadNote(
  context: StaffContext,
  leadId: string,
  body: string,
) {
  await context.db.insert(notes).values({
    id: crypto.randomUUID(),
    dealershipId: context.dealershipId,
    authorId: context.userId,
    leadId,
    body,
  });
  await context.db
    .update(leads)
    .set({ updatedAt: new Date(), stale: false })
    .where(
      tenantWhere(
        leads.dealershipId,
        context.dealershipId,
        eq(leads.id, leadId),
      ),
    );
}
