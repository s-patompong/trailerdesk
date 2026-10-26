import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import { dealershipOrganizations } from "./auth-organization";
import { configuration } from "./config";
import { emailSender } from "./email";
import { sha256 } from "./hash";
import * as schema from "./schema/auth";

import type { Database } from "./db";

export function createAuth(
  env: Env,
  db: Database,
  actorId: string | null = null,
) {
  const config = configuration(env);
  const mail = emailSender(env, db);
  return betterAuth({
    baseURL: config.app.url,
    trustedOrigins:
      config.app.environment === "development"
        ? [config.app.url, "http://127.0.0.1:5174"]
        : [config.app.url],
    secret: config.auth.secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url, token }) => {
        await mail.send({
          recipient: user.email,
          subject: "Reset your TrailerDesk password",
          body: `Choose a new password: ${url}`,
          idempotencyKey: `reset:${await sha256(token)}`,
          dealershipId: null,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        await mail.send({
          recipient: user.email,
          subject: "Verify your email for TrailerDesk",
          body: `Verify your email: ${url}`,
          idempotencyKey: `verify:${await sha256(token)}`,
          dealershipId: null,
        });
      },
    },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 100 },
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    socialProviders:
      config.auth.googleClientId && config.auth.googleClientSecret
        ? {
            google: {
              clientId: config.auth.googleClientId,
              clientSecret: config.auth.googleClientSecret,
            },
          }
        : {},
    plugins: [dealershipOrganizations(env, db, actorId)],
  });
}
