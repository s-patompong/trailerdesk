import { setupNetwork } from "@msw/cloudflare";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { http, HttpResponse } from "msw";
import { afterAll, beforeAll, expect, it } from "vitest";

import { withDatabase } from "./db";
import { emailSender } from "./email";
import { emailDeliveries } from "./schema/email";

const network = setupNetwork();
beforeAll(() => {
  network.enable();
});
afterAll(() => {
  network.disable();
});
it("the official Mailtrap SDK uses the sandbox endpoint in the Workers runtime", async () => {
  let calls = 0;
  network.use(
    http.post("https://sandbox.api.mailtrap.io/api/send/123", () => {
      calls++;
      return HttpResponse.json({
        success: true,
        message_ids: ["synthetic-sandbox-message"],
      });
    }),
  );
  const key = `unit:${crypto.randomUUID()}`;
  const stagingEnv = {
    ...env,
    APP_ENV: "staging",
    APP_URL: "https://staging.example.test",
    ADMIN_APP_URL: "https://admin-staging.example.test",
    PUBLIC_APP_URL: "https://public-staging.example.test",
    EMAIL_DRIVER: "mailtrap",
    MAILTRAP_API_TOKEN: "synthetic-unit-test-token",
    MAILTRAP_INBOX_ID: "123",
  };
  await withDatabase(env.DB, async (db) => {
    try {
      await emailSender(stagingEnv, db).send({
        idempotencyKey: key,
        dealershipId: null,
        recipient: "synthetic@example.test",
        subject: "Sandbox transport test",
        body: "Synthetic unit-test content.",
      });
      const rows = await db
        .select()
        .from(emailDeliveries)
        .where(eq(emailDeliveries.idempotencyKey, key));
      expect(calls).toBe(1);
      expect(rows[0]?.providerId).toBe("synthetic-sandbox-message");
    } finally {
      await db
        .delete(emailDeliveries)
        .where(eq(emailDeliveries.idempotencyKey, key));
    }
  });
});

it("the official Resend SDK sends a bounded provider key even for long internal keys", async () => {
  const headers: (string | null)[] = [];
  network.use(
    http.post("https://api.resend.com/emails", ({ request }) => {
      headers.push(request.headers.get("Idempotency-Key"));
      return HttpResponse.json({ id: "synthetic-resend-message" });
    }),
  );
  const key = `unit:${crypto.randomUUID()}:${"x".repeat(400)}`;
  const resendEnv = {
    ...env,
    EMAIL_DRIVER: "resend",
    RESEND_API_KEY: "synthetic-unit-test-key",
    ALLOW_LIVE_EMAIL: "true",
  };
  await withDatabase(env.DB, async (db) => {
    try {
      const message = {
        idempotencyKey: key,
        dealershipId: null,
        recipient: "synthetic@example.test",
        subject: "Resend transport test",
        body: "Synthetic unit-test content.",
      };
      await emailSender(resendEnv, db).send(message);
      await emailSender(resendEnv, db).send(message);
      expect(headers).toHaveLength(1);
      expect(headers[0]).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      await db
        .delete(emailDeliveries)
        .where(eq(emailDeliveries.idempotencyKey, key));
    }
  });
});
