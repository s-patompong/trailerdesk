import { hashPassword } from "better-auth/crypto";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { expect, it } from "vitest";

import { createAuth } from "./auth";
import { withDatabase } from "./db";
import { createPlatformAuth } from "./platform-auth";
import { account, user } from "./schema/platform-auth";

it("does not accept a platform session in the dealership auth realm", async () => {
  const userId = `platform-test-${crypto.randomUUID()}`;
  const email = `${userId}@example.test`;
  const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;

  await withDatabase(env.DB, async (db) => {
    await db.insert(user).values({
      id: userId,
      name: "Platform Test",
      email,
      emailVerified: true,
    });
    await db.insert(account).values({
      id: `${userId}-credential`,
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
    });

    try {
      const platformAuth = createPlatformAuth(env, db);
      const response = await platformAuth.handler(
        new Request(
          "http://admin.localhost:5174/api/admin-auth/sign-in/email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: "http://admin.localhost:5174",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          },
        ),
      );

      expect(response.status).toBe(200);
      const sessionCookie = response.headers
        .getSetCookie()
        .find((cookie) =>
          cookie.startsWith("trailerdesk_admin.session_token="),
        );
      expect(sessionCookie).toBeDefined();

      const staffSession = await createAuth(env, db).api.getSession({
        headers: new Headers({ Cookie: sessionCookie?.split(";")[0] ?? "" }),
      });
      expect(staffSession).toBeNull();
    } finally {
      await db.delete(user).where(eq(user.id, userId));
    }
  });
});
