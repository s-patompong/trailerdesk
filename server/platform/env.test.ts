import { env } from "cloudflare:workers";
import { expect, it } from "vitest";

import { configuration } from "./config";
import { validateEnv } from "./env";

it("uses T3 Env and Zod to parse strings and reject incomplete providers", () => {
  expect(validateEnv(env).DEMO_FAST_TIME).toBe(true);
  expect(() =>
    validateEnv({ ...env, GOOGLE_CLIENT_ID: "configured-without-secret" }),
  ).toThrow("Set both Google credentials");
  expect(() => validateEnv({ ...env, EMAIL_DRIVER: "resend" })).toThrow();
  expect(() => validateEnv({ ...env, APP_ENV: "production" })).toThrow(
    "Production requires",
  );
});
it("allows local Mailtrap and requires an explicit opt-in for live local email", () => {
  expect(
    configuration({
      ...env,
      APP_ENV: "development",
      EMAIL_DRIVER: "mailtrap",
      MAILTRAP_API_TOKEN: "synthetic-unit-test-token",
      MAILTRAP_INBOX_ID: "123",
    }).mail,
  ).toMatchObject({
    driver: "mailtrap",
    mailtrap: { sandbox: true, inboxId: 123 },
  });
  expect(() =>
    validateEnv({
      ...env,
      APP_ENV: "development",
      EMAIL_DRIVER: "resend",
      RESEND_API_KEY: "synthetic-unit-test-key",
    }),
  ).toThrow("ALLOW_LIVE_EMAIL=true");
  expect(() =>
    validateEnv({
      ...env,
      EMAIL_DRIVER: "mailpit",
      MAILPIT_URL: "https://external.example.test",
    }),
  ).toThrow("local inbox URL");
});
it("uses environment defaults only when the driver is not explicitly selected", () => {
  expect(
    configuration({ ...env, APP_ENV: "development", EMAIL_DRIVER: undefined })
      .mail.driver,
  ).toBe("mailpit");
  expect(() =>
    configuration({
      ...env,
      APP_ENV: "staging",
      APP_URL: "https://staging.example.test",
      ADMIN_APP_URL: "https://admin-staging.example.test",
      PUBLIC_APP_URL: "https://public-staging.example.test",
      EMAIL_DRIVER: undefined,
    }),
  ).toThrow("Mailtrap requires");
  expect(
    configuration({
      ...env,
      APP_ENV: "staging",
      APP_URL: "https://staging.example.test",
      ADMIN_APP_URL: "https://admin-staging.example.test",
      PUBLIC_APP_URL: "https://public-staging.example.test",
      EMAIL_DRIVER: undefined,
      MAILTRAP_API_TOKEN: "synthetic-unit-test-token",
      MAILTRAP_INBOX_ID: "123",
    }).mail.driver,
  ).toBe("mailtrap");
});
it("validates configurable feature timing and AI model names", () => {
  const config = configuration({
    ...env,
    DEMO_HOLD_SECONDS: "12",
    WORKERS_AI_MODEL: "@cf/zai-org/glm-4.7-flash",
    LEAD_STALE_DAYS: "7",
  });
  expect(config.features.holds.durationMs).toBe(12000);
  expect(config.features.jobs.staleLeadDays).toBe(7);
  expect(() =>
    configuration({
      ...env,
      DEMO_REVIEW_SECONDS: "2",
      DEMO_CHECK_IN_SECONDS: "3",
    }),
  ).toThrow("review delay");
  expect(() =>
    configuration({
      ...env,
      AGING_NOTICE_DAYS: "100",
      AGING_WARNING_DAYS: "90",
    }),
  ).toThrow("aging days");
});

it("requires isolated origin-only application URLs and auth secrets", () => {
  const validated = validateEnv(env);
  expect(
    configuration({ ...env, APP_URL: "http://app.localhost:5174/" }).app.url,
  ).toBe("http://app.localhost:5174");
  for (const invalidUrl of [
    "ftp://admin.localhost:5174",
    `http://${["user", "pass"].join(":")}@admin.localhost:5174`,
    "http://admin.localhost:5174/path",
    "http://admin.localhost:5174?preview=true",
    "http://admin.localhost:5174#section",
  ])
    expect(() => validateEnv({ ...env, ADMIN_APP_URL: invalidUrl })).toThrow(
      "Use an HTTP(S) origin",
    );
  expect(() =>
    validateEnv({
      ...env,
      ADMIN_APP_URL: "http://app.localhost:5175",
    }),
  ).toThrow("different hostnames");
  expect(() =>
    validateEnv({
      ...env,
      ADMIN_AUTH_SECRET: validated.BETTER_AUTH_SECRET,
    }),
  ).toThrow("authentication secrets must be different");
});
