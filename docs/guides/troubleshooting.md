# Troubleshooting

- **Postgres connection refused:** run `pnpm db:up`; check `docker compose ps` and port 5440.
- **Missing vector type:** run reviewed migrations; the first enables `vector`.
- **AI startup error 10063:** Cloudflare account needs a workers.dev subdomain. Login alone is insufficient.
- **AI quota exceeded:** Free plan requests stop at the daily limit. Do not silently fake an AI response.
- **Port in use:** TrailerDesk uses 5174; identify the owning process before changing anything. Do not stop unrelated projects.
- **Login fails:** run the local seed, use README credentials, check email verification and APP_URL.
- **Google button missing:** both Google credentials must be configured; see deployment guide for callbacks.
- **Tenant missing:** select a dealership. The server rejects absent or revoked memberships.
- **Concurrent edit:** refresh before editing again; inventory uses a version predicate.
- **Secret scan cannot start:** start Docker. The hook uses the pinned Betterleaks image with network access disabled; do not bypass it.
- **Guardrail fails:** fix the source or a demonstrated false positive. Do not disable checks to claim completion.

## Dependency packaging workarounds

`@workflow/serde@4.1.0` ships a sourcemap pointing to an absent source file. The pinned
pnpm patch removes only its broken sourceMappingURL comment; runtime code is unchanged.
Remove the patch after an upstream release fixes the published map and rerun all checks.

The official Mailtrap SDK must remain outside Vitest's SSR prebundle list: bundling it
selects browser Axios, which requests an unsupported workerd cache mode. The normal
Node transport is covered by an HTTP-mocked workerd test. Resend and pg are prebundled
for their own runtime/packaging requirements. Keep these exceptions narrow.
