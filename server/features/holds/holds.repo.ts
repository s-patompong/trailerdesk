import { and, eq, isNull } from "drizzle-orm";

import { user } from "../../platform/schema/auth";
import { auditLog, customers } from "../../platform/schema/crm";
import { holds } from "../../platform/schema/sales";
import { tenantWhere } from "../../platform/tenant";

import type { holdCommand } from "./holds.schemas";
import type { StaffContext } from "../../platform/context";
import type { z } from "zod";

export async function activeHold(context: StaffContext, trailerId: string) {
  const rows = await context.db
    .select({
      id: holds.id,
      dealershipId: holds.dealershipId,
      trailerId: holds.trailerId,
      customerId: holds.customerId,
      salespersonId: holds.salespersonId,
      expiresAt: holds.expiresAt,
      customerName: customers.name,
      salespersonName: user.name,
    })
    .from(holds)
    .innerJoin(
      customers,
      and(
        eq(customers.id, holds.customerId),
        tenantWhere(customers.dealershipId, context.dealershipId),
      ),
    )
    .innerJoin(user, eq(user.id, holds.salespersonId))
    .where(
      tenantWhere(
        holds.dealershipId,
        context.dealershipId,
        eq(holds.trailerId, trailerId),
        isNull(holds.releasedAt),
      ),
    )
    .limit(1);
  return rows[0];
}
export async function insertHold(
  context: StaffContext,
  command: z.infer<typeof holdCommand>,
) {
  await context.db.insert(holds).values({
    ...command,
    dealershipId: context.dealershipId,
    expiresAt: new Date(command.expiresAt),
  });
  await context.db.insert(auditLog).values({
    id: crypto.randomUUID(),
    dealershipId: context.dealershipId,
    actorId: command.salespersonId,
    action: "trailer.hold_placed",
    recordId: command.trailerId,
    details: JSON.stringify({
      holdId: command.id,
      expiresAt: command.expiresAt,
    }),
  });
}
export async function releaseHoldRow(
  context: StaffContext,
  holdId: string,
  actorId: string,
) {
  const rows = await context.db
    .update(holds)
    .set({ releasedAt: new Date() })
    .where(
      tenantWhere(
        holds.dealershipId,
        context.dealershipId,
        eq(holds.id, holdId),
        isNull(holds.releasedAt),
      ),
    )
    .returning();
  const released = rows[0];
  if (released)
    await context.db.insert(auditLog).values({
      id: crypto.randomUUID(),
      dealershipId: context.dealershipId,
      actorId,
      action: "trailer.hold_released",
      recordId: released.trailerId,
      details: JSON.stringify({ holdId }),
    });
  return released;
}
export async function findHold(context: StaffContext, id: string) {
  const rows = await context.db
    .select({
      id: holds.id,
      trailerId: holds.trailerId,
      salespersonId: holds.salespersonId,
      expiresAt: holds.expiresAt,
      releasedAt: holds.releasedAt,
      email: user.email,
    })
    .from(holds)
    .innerJoin(user, eq(user.id, holds.salespersonId))
    .where(
      tenantWhere(holds.dealershipId, context.dealershipId, eq(holds.id, id)),
    )
    .limit(1);
  return rows[0];
}
export async function extendHoldRow(
  context: StaffContext,
  id: string,
  expiresAt: number,
) {
  await context.db
    .update(holds)
    .set({ expiresAt: new Date(expiresAt) })
    .where(
      tenantWhere(
        holds.dealershipId,
        context.dealershipId,
        eq(holds.id, id),
        isNull(holds.releasedAt),
      ),
    );
}
