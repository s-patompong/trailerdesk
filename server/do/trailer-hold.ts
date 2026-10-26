import { DurableObject } from "cloudflare:workers";

import {
  holdCommand,
  holdExtend,
  holdRelease,
} from "../features/holds/holds.schemas";
import {
  finishHold,
  getActiveHold,
  lengthenHold,
  reserveHold,
} from "../features/holds/holds.service";

import type { z } from "zod";

export class TrailerHold extends DurableObject<Env> {
  private verifyName(dealershipId: string, trailerId: string): void {
    if (this.ctx.id.name !== `${dealershipId}:${trailerId}`)
      throw new Error("Hold identity does not match this trailer.");
  }
  async place(input: unknown) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const command = holdCommand.parse(input);
      this.verifyName(command.dealershipId, command.trailerId);
      let current = await getActiveHold(
        this.env,
        command.dealershipId,
        command.trailerId,
      );
      if (current && current.expiresAt.getTime() <= Date.now()) {
        await finishHold(this.env, {
          dealershipId: command.dealershipId,
          trailerId: command.trailerId,
          holdId: current.id,
          reason: "expired",
        });
        current = undefined;
      }
      if (current) return { placed: false as const, hold: current };
      const hold = await reserveHold(this.env, command);
      await this.ctx.storage.put("hold", command);
      await this.ctx.storage.setAlarm(command.expiresAt);
      return { placed: true as const, hold };
    });
  }
  async release(input: unknown): Promise<void> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const command = holdRelease.parse(input);
      this.verifyName(command.dealershipId, command.trailerId);
      await finishHold(this.env, command);
      const stored =
        await this.ctx.storage.get<z.infer<typeof holdCommand>>("hold");
      if (stored?.id === command.holdId) {
        await this.ctx.storage.delete("hold");
        await this.ctx.storage.deleteAlarm();
      }
    });
  }
  async extend(input: unknown): Promise<void> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const command = holdExtend.parse(input);
      this.verifyName(command.dealershipId, command.trailerId);
      await lengthenHold(this.env, command);
      const stored =
        await this.ctx.storage.get<z.infer<typeof holdCommand>>("hold");
      if (stored?.id === command.holdId)
        await this.ctx.storage.put("hold", {
          ...stored,
          expiresAt: command.expiresAt,
        });
      await this.ctx.storage.setAlarm(command.expiresAt);
    });
  }
  override async alarm(): Promise<void> {
    const stored = await this.ctx.storage.get("hold");
    if (!stored) return;
    const command = holdCommand.parse(stored);
    const current = await getActiveHold(
      this.env,
      command.dealershipId,
      command.trailerId,
    );
    if (current && current.expiresAt.getTime() > Date.now()) {
      await this.ctx.storage.setAlarm(current.expiresAt.getTime());
      return;
    }
    await this.release({
      dealershipId: command.dealershipId,
      trailerId: command.trailerId,
      holdId: command.id,
      reason: "expired",
    });
  }
}
