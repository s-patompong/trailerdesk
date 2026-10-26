import { configuration } from "../../platform/config";
import { withStaff, withSystem } from "../../platform/context";
import { emailSender } from "../../platform/email";
import { DomainError } from "../../platform/errors";
import { requirePermission } from "../../platform/permissions";
import { requireCustomer } from "../customers/customers.service";
import {
  lockForSale,
  requireAvailableTrailer,
  updateAvailability,
} from "../inventory/inventory.service";

import {
  activeHold,
  extendHoldRow,
  findHold,
  insertHold,
  releaseHoldRow,
} from "./holds.repo";
import {
  holdCommand,
  holdExtend,
  holdRelease,
  holdRequest,
} from "./holds.schemas";

import type { StaffContext } from "../../platform/context";

export function getActiveHold(
  env: Env,
  dealershipId: string,
  trailerId: string,
) {
  return withSystem(env, dealershipId, (context) =>
    activeHold(context, trailerId),
  );
}
export function reserveHold(env: Env, input: unknown) {
  const command = holdCommand.parse(input);
  return withSystem(env, command.dealershipId, (context) =>
    context.db.transaction(async (tx) => {
      const scoped = { ...context, db: tx };
      await requireCustomer(scoped, command.customerId);
      await requireAvailableTrailer(scoped, command.trailerId);
      await insertHold(scoped, command);
      await updateAvailability(
        scoped,
        command.trailerId,
        "on_hold",
        "in_stock",
      );
      return activeHold(scoped, command.trailerId);
    }),
  );
}
export function finishHold(env: Env, input: unknown) {
  const command = holdRelease.parse(input);
  return withSystem(env, command.dealershipId, async (context) => {
    const hold = await findHold(context, command.holdId);
    if (hold?.trailerId !== command.trailerId) return;
    if (command.reason === "expired" && hold.expiresAt.getTime() > Date.now())
      throw new DomainError("conflict", "This hold has been extended.");
    await context.db.transaction(async (tx) => {
      const scoped = { ...context, db: tx };
      await lockForSale(scoped, hold.trailerId);
      const released = await releaseHoldRow(scoped, hold.id, command.actorId);
      if (released)
        await updateAvailability(scoped, hold.trailerId, "in_stock", "on_hold");
    });
    await emailSender(env, context.db).send({
      dealershipId: command.dealershipId,
      recipient: hold.email,
      subject:
        command.reason === "expired"
          ? "Your trailer hold has expired"
          : "Your trailer hold was released",
      body: `The hold on trailer ${hold.trailerId} has been ${command.reason === "expired" ? "automatically released after expiring" : "released"}. Open TrailerDesk to see its current availability.`,
      idempotencyKey: `hold-release:${hold.id}`,
    });
  });
}
export function lengthenHold(env: Env, input: unknown) {
  const command = holdExtend.parse(input);
  return withSystem(env, command.dealershipId, async (context) => {
    const hold = await findHold(context, command.holdId);
    if (
      hold?.trailerId !== command.trailerId ||
      hold.releasedAt ||
      hold.expiresAt.getTime() <= Date.now()
    )
      throw new DomainError("conflict", "This hold has already ended.");
    await extendHoldRow(context, command.holdId, command.expiresAt);
  });
}
export function placeTrailerHold(
  request: Request,
  env: Env,
  trailerId: string,
  input: unknown,
) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "deals.write");
    const { customerId } = holdRequest.parse(input);
    await requireCustomer(context, customerId);
    const duration = configuration(env).features.holds.durationMs;
    return env.TRAILER_HOLD.getByName(
      `${context.dealershipId}:${trailerId}`,
    ).place({
      id: crypto.randomUUID(),
      dealershipId: context.dealershipId,
      trailerId,
      customerId,
      salespersonId: context.userId,
      expiresAt: Date.now() + duration,
    });
  });
}
export function manageTrailerHold(
  request: Request,
  env: Env,
  trailerId: string,
  action: "release" | "extend",
) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "holds.manage");
    const hold = await activeHold(context, trailerId);
    if (!hold)
      throw new DomainError(
        "not_found",
        "There is no active hold on this trailer.",
      );
    const stub = env.TRAILER_HOLD.getByName(
      `${context.dealershipId}:${trailerId}`,
    );
    if (action === "release")
      await stub.release({
        dealershipId: context.dealershipId,
        trailerId,
        holdId: hold.id,
        reason: "released",
        actorId: context.userId,
      });
    else
      await stub.extend({
        dealershipId: context.dealershipId,
        trailerId,
        holdId: hold.id,
        expiresAt:
          Math.max(Date.now(), hold.expiresAt.getTime()) +
          configuration(env).features.holds.durationMs,
      });
    return { saved: true };
  });
}

export function readTrailerHold(request: Request, env: Env, trailerId: string) {
  return withStaff(
    request,
    env,
    async (context) => (await activeHold(context, trailerId)) ?? null,
  );
}

export function holdForClosing(context: StaffContext, trailerId: string) {
  return activeHold(context, trailerId);
}
