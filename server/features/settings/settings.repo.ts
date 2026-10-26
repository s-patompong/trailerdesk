import { desc, eq } from "drizzle-orm";

import { organization } from "../../platform/schema/auth";
import { auditLog } from "../../platform/schema/crm";
import { dealership } from "../../platform/schema/inventory";
import { tenantWhere } from "../../platform/tenant";

import type { profileInput } from "./settings.schemas";
import type { StaffContext } from "../../platform/context";
import type { z } from "zod";

export async function findProfile(context: StaffContext) {
  const rows = await context.db
    .select({
      profile: dealership,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
    })
    .from(dealership)
    .innerJoin(organization, eq(organization.id, dealership.dealershipId))
    .where(tenantWhere(dealership.dealershipId, context.dealershipId))
    .limit(1);
  return rows[0];
}
export async function updateProfile(
  context: StaffContext,
  input: z.infer<typeof profileInput>,
) {
  const { name, ...profile } = input;
  await context.db
    .update(dealership)
    .set(profile)
    .where(tenantWhere(dealership.dealershipId, context.dealershipId));
  await context.db
    .update(organization)
    .set({ name })
    .where(eq(organization.id, context.dealershipId));
}
export function saveLogo(context: StaffContext, logo: string) {
  return context.db
    .update(organization)
    .set({ logo })
    .where(eq(organization.id, context.dealershipId));
}
export function recentAudit(context: StaffContext) {
  return context.db
    .select()
    .from(auditLog)
    .where(tenantWhere(auditLog.dealershipId, context.dealershipId))
    .orderBy(desc(auditLog.createdAt))
    .limit(50);
}
