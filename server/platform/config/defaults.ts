export const mailDefaults = {
  development: "mailpit",
  test: "outbox",
  staging: "mailtrap",
  production: "resend",
} as const;
export const modelDefaults = {
  workersAi: "@cf/openai/gpt-oss-120b",
  anthropic: "claude-sonnet-5-5",
  embedding: "@cf/baai/bge-base-en-v1.5",
  embeddingDimensions: 768,
} as const;
export const featureDefaults = {
  holdHours: 48,
  demoHoldSeconds: 30,
  checkInDays: 3,
  reviewAfterCheckInDays: 30,
  demoCheckInSeconds: 3,
  demoReviewSeconds: 9,
  staleLeadDays: 14,
  nightlyHour: 2,
  summaryHour: 8,
  agingDays: [60, 90, 120],
} as const;
