# ADR 0007: Validated configuration and selectable mail transports

Date: 2026-10-26. Status: accepted by user instruction.

## Context

This repository is a template for other projects. The user requested established
libraries for configuration/email and Laravel-style provider selection, including
Mailtrap in local development. Environment names must not hardwire the mail driver.

## Decision

Use T3 Env Core with Zod, explicit server runtime bindings, and
`emptyStringAsUndefined: true`. Expose grouped typed settings through
`server/platform/config/`. An explicit `EMAIL_DRIVER` overrides environment defaults:
Mailpit in development, outbox in tests, Mailtrap Sandbox in staging, Resend in production.

Use official Mailtrap and Resend SDKs. Mailpit exposes a small documented HTTP send
API; its native inbox replaces a homegrown SMTP server/viewer. Keep the existing
outbox only as an explicit test/debug transport. Mailtrap always targets Sandbox.
Live Resend outside production requires an explicit opt-in. Provider credentials
are required only for the chosen driver. Do not serialize server configuration.

Feature timings, thresholds and AI model names use the same validated configuration.
Dealership tax/fees/timezone stay in database settings. Cloudflare binding selection
stays in Wrangler. Embedding dimensions require migration/reindex coordination.

## Evidence and tradeoffs

Checked 2026-10-26: T3 Env Core 0.13.11 is a supported small utility (latest release
March 22; repository push April 1), Mailtrap SDK 5.0.0 has October release activity,
and Mailpit 1.32.0 was released October 22. Release recency alone is not proof of fit;
workerd tests verify config and Mailtrap transport compatibility. Real Mailtrap inbox
and production Resend delivery still require account credentials and verification.

A permanent delivery ledger prevents ordinary replay/concurrent duplicate sends.
An external provider and Postgres cannot commit atomically. See background-work docs
for the crash window and old ambiguous-delivery handling. This adapter does not
implement SMTP, secret storage or a generic provider extension framework.

## Sources

- https://env.t3.gg/docs/core
- https://github.com/t3-oss/t3-env/releases
- https://github.com/railsware/mailtrap-nodejs
- https://docs.mailtrap.io/email-sandbox
- https://mailpit.axllent.org/docs/api-v1/
- https://github.com/axllent/mailpit/releases
- https://resend.com/docs/send-with-nodejs
- https://resend.com/docs/dashboard/emails/idempotency-keys
