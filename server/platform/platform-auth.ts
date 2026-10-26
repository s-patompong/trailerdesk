import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import { configuration } from "./config";
import { emailSender } from "./email";
import { sha256 } from "./hash";
import * as schema from "./schema/platform-auth";

import type { Database } from "./db";

export function createPlatformAuth(env: Env, db: Database) {
  const config = configuration(env);
  const mail = emailSender(env, db);
  return betterAuth({
    baseURL: config.app.adminUrl,
    basePath: "/api/admin-auth",
    trustedOrigins: [config.app.adminUrl],
    secret: config.auth.adminSecret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    advanced: {
      cookiePrefix: "trailerdesk_admin",
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url, token }) => {
        await mail.send({
          recipient: user.email,
          subject: "Reset your TrailerDesk platform password",
          body: `Choose a new password: ${url}`,
          idempotencyKey: `platform-reset:${await sha256(token)}`,
          dealershipId: null,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        await mail.send({
          recipient: user.email,
          subject: "Verify your TrailerDesk platform email",
          body: `Verify your email: ${url}`,
          idempotencyKey: `platform-verify:${await sha256(token)}`,
          dealershipId: null,
        });
      },
    },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 100 },
  });
}
