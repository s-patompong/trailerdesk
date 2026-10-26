import type { RuntimeEnv } from "../env";

export function featureConfiguration(env: RuntimeEnv) {
  return {
    holds: {
      durationMs: env.DEMO_FAST_TIME
        ? env.DEMO_HOLD_SECONDS * 1000
        : env.HOLD_HOURS * 60 * 60 * 1000,
    },
    closing: {
      checkInMs: env.DEMO_FAST_TIME
        ? env.DEMO_CHECK_IN_SECONDS * 1000
        : env.CHECK_IN_DAYS * 86400000,
      reviewMs: env.DEMO_FAST_TIME
        ? env.DEMO_REVIEW_SECONDS * 1000
        : (env.CHECK_IN_DAYS + env.REVIEW_AFTER_CHECK_IN_DAYS) * 86400000,
    },
    jobs: {
      staleLeadDays: env.LEAD_STALE_DAYS,
      nightlyHour: env.NIGHTLY_JOB_HOUR,
      summaryHour: env.MORNING_SUMMARY_HOUR,
      agingDays: [
        env.AGING_NOTICE_DAYS,
        env.AGING_WARNING_DAYS,
        env.AGING_CRITICAL_DAYS,
      ] as const,
    },
  };
}
