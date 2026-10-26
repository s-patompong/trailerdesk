import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import {
  featureDefaults,
  mailDefaults,
  modelDefaults,
} from "./config/defaults";

const optionalSecret = z.string().min(1).optional();
const applicationOrigin = z
  .url()
  .superRefine((value, ctx) => {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Use an HTTP(S) origin without credentials, a path, query, or fragment.",
      });
  })
  .transform((value) => new URL(value).origin);
const server = {
  APP_ENV: z.enum(["development", "test", "staging", "production"]),
  APP_URL: applicationOrigin,
  ADMIN_APP_URL: applicationOrigin,
  PUBLIC_APP_URL: applicationOrigin,
  BETTER_AUTH_SECRET: z.string().min(32),
  ADMIN_AUTH_SECRET: z.string().min(32),
  EMAIL_FROM: z.email(),
  EMAIL_DRIVER: z.enum(["mailpit", "outbox", "mailtrap", "resend"]).optional(),
  ALLOW_LIVE_EMAIL: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default(false),
  MAILPIT_URL: z.url().optional(),
  MAILTRAP_API_TOKEN: optionalSecret,
  MAILTRAP_INBOX_ID: z.coerce.number().int().positive().optional(),
  LLM_PROVIDER: z.enum(["workers-ai", "anthropic"]).default("workers-ai"),
  WORKERS_AI_MODEL: z
    .templateLiteral(["@cf/", z.string().min(1)])
    .default(modelDefaults.workersAi),
  ANTHROPIC_MODEL: z.string().min(1).default(modelDefaults.anthropic),
  HOLD_HOURS: z.coerce
    .number()
    .int()
    .min(1)
    .max(168)
    .default(featureDefaults.holdHours),
  DEMO_HOLD_SECONDS: z.coerce
    .number()
    .int()
    .min(5)
    .max(3600)
    .default(featureDefaults.demoHoldSeconds),
  CHECK_IN_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .default(featureDefaults.checkInDays),
  REVIEW_AFTER_CHECK_IN_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .default(featureDefaults.reviewAfterCheckInDays),
  DEMO_CHECK_IN_SECONDS: z.coerce
    .number()
    .int()
    .min(1)
    .max(3600)
    .default(featureDefaults.demoCheckInSeconds),
  DEMO_REVIEW_SECONDS: z.coerce
    .number()
    .int()
    .min(2)
    .max(7200)
    .default(featureDefaults.demoReviewSeconds),
  AGING_NOTICE_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(3650)
    .default(featureDefaults.agingDays[0]),
  AGING_WARNING_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(3650)
    .default(featureDefaults.agingDays[1]),
  AGING_CRITICAL_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(3650)
    .default(featureDefaults.agingDays[2]),
  LEAD_STALE_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .default(featureDefaults.staleLeadDays),
  NIGHTLY_JOB_HOUR: z.coerce
    .number()
    .int()
    .min(0)
    .max(23)
    .default(featureDefaults.nightlyHour),
  MORNING_SUMMARY_HOUR: z.coerce
    .number()
    .int()
    .min(0)
    .max(23)
    .default(featureDefaults.summaryHour),
  DEMO_FAST_TIME: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
  TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: optionalSecret,
  GOOGLE_CLIENT_SECRET: optionalSecret,
  ANTHROPIC_API_KEY: optionalSecret,
  RESEND_API_KEY: optionalSecret,
};
type Configuration = z.output<z.ZodObject<typeof server>>;
function mailRequirements(value: Configuration, ctx: z.RefinementCtx): void {
  const fail = (message: string) => {
    ctx.addIssue({ code: "custom", message });
  };
  const driver = value.EMAIL_DRIVER ?? mailDefaults[value.APP_ENV];
  if (driver === "resend" && !value.RESEND_API_KEY)
    fail("Resend requires an API key.");
  if (
    driver === "resend" &&
    value.APP_ENV !== "production" &&
    !value.ALLOW_LIVE_EMAIL
  )
    fail("Live email outside production requires ALLOW_LIVE_EMAIL=true.");
  if (
    driver === "mailtrap" &&
    (!value.MAILTRAP_API_TOKEN || !value.MAILTRAP_INBOX_ID)
  )
    fail("Mailtrap requires a sandbox token and inbox ID.");
  if (
    driver === "mailpit" &&
    (!value.MAILPIT_URL ||
      !["localhost", "127.0.0.1"].includes(new URL(value.MAILPIT_URL).hostname))
  )
    fail("Mailpit requires a local inbox URL.");
  if (driver === "mailpit" && ["staging", "production"].includes(value.APP_ENV))
    fail(
      "Mailpit runs locally. Choose Mailtrap or Resend for a cloud environment.",
    );
  if (driver === "outbox" && ["staging", "production"].includes(value.APP_ENV))
    fail(
      "The test outbox is only available locally. Choose Mailtrap or Resend for cloud email.",
    );
}
function requirements(value: Configuration, ctx: z.RefinementCtx): void {
  const fail = (message: string) => {
    ctx.addIssue({ code: "custom", message });
  };
  mailRequirements(value, ctx);
  if (Boolean(value.GOOGLE_CLIENT_ID) !== Boolean(value.GOOGLE_CLIENT_SECRET))
    fail("Set both Google credentials together.");
  if (value.LLM_PROVIDER === "anthropic" && !value.ANTHROPIC_API_KEY)
    fail("Anthropic requires an API key.");
  if (
    value.APP_ENV === "staging" &&
    (!value.APP_URL.startsWith("https://") ||
      !value.ADMIN_APP_URL.startsWith("https://") ||
      !value.PUBLIC_APP_URL.startsWith("https://"))
  )
    fail("Staging requires HTTPS.");
  if (
    value.APP_ENV === "production" &&
    (value.DEMO_FAST_TIME ||
      !value.APP_URL.startsWith("https://") ||
      !value.ADMIN_APP_URL.startsWith("https://") ||
      !value.PUBLIC_APP_URL.startsWith("https://") ||
      value.TURNSTILE_SECRET_KEY.startsWith("1x0000") ||
      value.BETTER_AUTH_SECRET.startsWith("local-only") ||
      value.ADMIN_AUTH_SECRET.startsWith("local-only"))
  )
    fail("Production requires HTTPS, real secrets, and normal timing.");
  const hostnames = [
    value.APP_URL,
    value.ADMIN_APP_URL,
    value.PUBLIC_APP_URL,
  ].map((url) => new URL(url).hostname);
  if (new Set(hostnames).size !== hostnames.length)
    fail("Admin, staff, and public URLs must use different hostnames.");
  if (value.BETTER_AUTH_SECRET === value.ADMIN_AUTH_SECRET)
    fail("Admin and dealership authentication secrets must be different.");
  if (!(
    value.AGING_NOTICE_DAYS < value.AGING_WARNING_DAYS &&
    value.AGING_WARNING_DAYS < value.AGING_CRITICAL_DAYS
  ))
    fail(
      "Inventory aging days must increase from notice to warning to critical.",
    );
  if (value.DEMO_REVIEW_SECONDS <= value.DEMO_CHECK_IN_SECONDS)
    fail("The demo review delay must follow the demo check-in delay.");
}
export function validateEnv(input: unknown) {
  const values = z.record(z.string(), z.unknown()).parse(input);
  const runtimeEnv = Object.fromEntries(
    Object.entries(values).map(
      ([key, value]): [string, string | number | boolean | undefined] => [
        key,
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
          ? value
          : undefined,
      ],
    ),
  );
  return createEnv({
    server,
    runtimeEnv,
    emptyStringAsUndefined: true,
    createFinalSchema: (shape) => z.object(shape).superRefine(requirements),
    onValidationError: (issues) => {
      throw new Error(
        `TrailerDesk configuration is invalid: ${issues.map((issue) => `${issue.path?.map((part) => (typeof part === "object" ? String(part.key) : String(part))).join(".") ?? "env"}: ${issue.message}`).join(" ")}`,
      );
    },
  });
}

export type RuntimeEnv = ReturnType<typeof validateEnv>;
