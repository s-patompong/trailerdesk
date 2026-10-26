import { desc, eq } from "drizzle-orm";

import { failedJobs } from "../../platform/schema/search";
import { tenantWhere } from "../../platform/tenant";

import type { StaffContext } from "../../platform/context";

export function listFailedJobs(context: StaffContext) {
  return context.db
    .select({
      id: failedJobs.id,
      kind: failedJobs.kind,
      error: failedJobs.error,
      createdAt: failedJobs.createdAt,
      retriedAt: failedJobs.retriedAt,
    })
    .from(failedJobs)
    .where(tenantWhere(failedJobs.dealershipId, context.dealershipId))
    .orderBy(desc(failedJobs.createdAt))
    .limit(100);
}
export async function findFailedJob(context: StaffContext, id: string) {
  const rows = await context.db
    .select()
    .from(failedJobs)
    .where(
      tenantWhere(
        failedJobs.dealershipId,
        context.dealershipId,
        eq(failedJobs.id, id),
      ),
    )
    .limit(1);
  return rows[0];
}
export async function insertFailedJob(
  context: StaffContext,
  id: string,
  kind: string,
  payload: unknown,
) {
  await context.db
    .insert(failedJobs)
    .values({
      id,
      dealershipId: context.dealershipId,
      kind,
      payload,
      error: "This job could not be completed after several attempts.",
    })
    .onConflictDoNothing();
}
export async function markRetried(context: StaffContext, id: string) {
  await context.db
    .update(failedJobs)
    .set({ retriedAt: new Date() })
    .where(
      tenantWhere(
        failedJobs.dealershipId,
        context.dealershipId,
        eq(failedJobs.id, id),
      ),
    );
}
