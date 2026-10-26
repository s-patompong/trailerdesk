# Deployment

Not deployed. This repository intentionally stops at a deployment-ready handoff. Do not
run the deploy command or create cloud resources without a separate, explicit deployment
request. Placeholder resource IDs in `wrangler.jsonc` are local configuration, not
provisioned resources. A deploying person or agent must replace and independently verify
them rather than treating the example as live infrastructure.

Phase 2 is complete: the public repository, incremental conventional commits and green
quality/browser CI evidence are recorded in the [Phase 2 report](../phase-2-report.md).

The manual E2E workflow starts the local Worker with its Workers AI binding in remote
mode. Its account-scoped `CLOUDFLARE_API_TOKEN` therefore needs `Workers Scripts: Edit`
for Wrangler's edge-preview session and `Workers AI: Read` plus `Workers AI: Edit` for
the bound model. Store the account ID as the `CLOUDFLARE_ACCOUNT_ID` repository variable;
never commit either value. Required PR and `main` checks are secret-free; only an explicit
manual E2E dispatch uses this token. This is test authentication, not permission to deploy
or create Cloudflare resources.

Production requires a hosted Postgres choice (for example Neon or PlanetScale), two Hyperdrive
configurations, KV, R2, queues/DLQ, Turnstile, email, Google OAuth and secrets.
Enable pgvector before migrations. Never copy local demo accounts into production
without an explicit reviewed seed decision.

Google redirect URIs, with the current auth base path:

- Local: `http://localhost:5174/api/auth/callback/google`
- Local alternate host: `http://127.0.0.1:5174/api/auth/callback/google`
- Production: `https://trailerdesk.<ACCOUNT_SUBDOMAIN>.workers.dev/api/auth/callback/google`

The account dashboard currently displays `p-pangpond.workers.dev`; if retained,
the planned production callback would be
`https://trailerdesk.p-pangpond.workers.dev/api/auth/callback/google`.
The app is not deployed there. Configure `APP_URL` to the actual final origin.
Set both Google secrets to enable the button. Production OAuth verification is pending.

Production Zod validation rejects local auth secrets, test Turnstile keys, fast demo
timing, HTTP origins and dev outbox email. Set secrets using `wrangler secret put`.
Add staging only during Phase 3, deploy production first, and verify both configuration
readback and live behavior. Update this guide with actual resource IDs and release evidence.

For an initial production footprint of about 14 dealerships and 50+ daily staff users,
use Workers Paid rather than relying on the Free plan's 10 ms CPU limit. Configure both
Hyperdrive pools conservatively against the database connection limit, consider Smart
Placement near the database, and measure request CPU, database latency, query count,
Queue failures and form rejection rates. Public embed configuration and inventory may
be cached; authentication, permissions, operational dashboards and read-after-write must
use the cache-disabled binding.
