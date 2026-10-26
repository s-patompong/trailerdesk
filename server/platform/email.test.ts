import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { withDatabase } from "./db";
import { deliverOnce } from "./email-delivery";
import { emailDeliveries } from "./schema/email";

import type { EmailMessage } from "./email-message";

function message(): EmailMessage {
  return {
    recipient: "email-test@example.test",
    subject: "Delivery test",
    body: "A synthetic test message.",
    idempotencyKey: `unit:${crypto.randomUUID()}`,
    dealershipId: null,
  };
}
describe("email delivery ledger", () => {
  it("serializes concurrent deliveries and keeps a permanent sent record", async () => {
    const input = message();
    let sends = 0;
    try {
      await Promise.all(
        [1, 2].map(() =>
          withDatabase(env.DB, (db) =>
            deliverOnce(db, input, () => {
              sends++;
              return Promise.resolve("synthetic-provider-id");
            }),
          ),
        ),
      );
      expect(sends).toBe(1);
    } finally {
      await withDatabase(env.DB, async (db) => {
        await db
          .delete(emailDeliveries)
          .where(eq(emailDeliveries.idempotencyKey, input.idempotencyKey));
      });
    }
  });
  it("retries a provider failure and stops ambiguous attempts after the provider key window", async () => {
    const input = message();
    await withDatabase(env.DB, async (db) => {
      try {
        await expect(
          deliverOnce(db, input, () =>
            Promise.reject(new Error("Synthetic provider failure")),
          ),
        ).rejects.toThrow("Synthetic provider failure");
        await db
          .update(emailDeliveries)
          .set({ createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) })
          .where(eq(emailDeliveries.idempotencyKey, input.idempotencyKey));
        let sent = false;
        await expect(
          deliverOnce(db, input, () => {
            sent = true;
            return Promise.resolve("unexpected");
          }),
        ).rejects.toThrow("needs review");
        expect(sent).toBe(false);
      } finally {
        await db
          .delete(emailDeliveries)
          .where(eq(emailDeliveries.idempotencyKey, input.idempotencyKey));
      }
    });
  });
});
