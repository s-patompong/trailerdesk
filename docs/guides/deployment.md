# Deployment

Not deployed. Phase 1 is local only. Do not run the deploy command or create cloud
resources before the user's Phase 3 approval. Placeholder resource IDs in
`wrangler.jsonc` are local configuration, not provisioned resources.

Phase 2 requires the user's GitHub repository name and visibility, incremental
conventional commits, push and a verified green CI run.

Phase 3 requires approval of hosted Postgres (Neon or PlanetScale), two Hyperdrive
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
