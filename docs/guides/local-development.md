# Local development

Follow the root README quick start. The staff application is
`http://app.localhost:5174`; platform administration is `http://admin.localhost:5174`;
public inventory and embedded forms use `http://localhost:5174`. Browsers resolve names
below `.localhost` to loopback, so
no hosts-file edit or local DNS service is needed. Port 5173 is reserved by another local
project, so TrailerDesk uses a strict port rather than silently moving.

Copy `.env.example` to `.env`. Docker Compose, dotenvx and the Cloudflare Vite plugin
load this one file, so Postgres connectivity, Mailpit ports, Worker runtime settings and
local secrets can be changed without editing source files. T3 Env and Zod validate
database URLs before migrations or tests and Worker settings at handler entry.

`pnpm db:up` starts Docker Compose: `pgvector/pgvector:pg17` on loopback port 5440
and Mailpit on loopback port 18025 (SMTP port 11025) by default. Named volumes preserve both.
Postgres has separate `trailerdesk` and `trailerdesk_test` databases. Test setup applies
the reviewed Drizzle migrations to the test database. Never point tests or the local
seed at a shared/production database. Do not remove volumes to fix a test failure.

`.env` sets Cloudflare's documented
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_DB` and `_DB_CACHED` overrides. They
replace committed local connection strings. `DB_CACHED` does not simulate cloud query
caching locally. Use `DB` for sessions, operational dashboards, mutations and immediate
reads after writes.

`.env` is ignored by Git and is never production secret storage. Optional Google
credentials must be set as a pair. Local email/password login is the default. Mailpit captures local email;
`/dev/mail` opens its native inbox. The explicit `outbox` driver retains the database
viewer for tests/debugging. See [configuration](configuration.md) to select Mailtrap
locally, change AI providers or adjust feature settings. Restart dev after env changes.

Workers AI always runs remotely. Run `pnpm exec wrangler login` before seeding or
starting dev. If startup fails with Cloudflare error 10063, finish workers.dev subdomain
onboarding. Do not upgrade plans without approval. Verify current model availability
and pricing in the [Workers AI documentation](https://developers.cloudflare.com/workers-ai/).
The seed waits for real document and trailer indexing; an AI failure must remain visible.

`pnpm dev` runs the app, queues, SQLite Durable Object alarms and Workflow in workerd.
`DEMO_FAST_TIME=true` shortens holds and follow-up delays for local verification.
Production rejects fast timing. Durable local state is under `.wrangler/`.

Open `/embed-demo.html` for a host-page example using `/embed/v1.js`. The seeded form
key is `ridgeline-contact-form`. This exercises the real iframe, Turnstile, Queue,
tenant-scoped lead creation and local email path.

`APP_URL` is the canonical dealership staff origin, `ADMIN_APP_URL` is the platform-admin
origin, and `PUBLIC_APP_URL` is the shopper and embed origin. The entry handler redirects
safe requests to the correct host and rejects mutations sent to the wrong host. Dealership
and platform logins are separate Better Auth instances with separate Postgres tables,
secrets and host-only cookie prefixes. The public origin has no authentication realm. Keep
all three as distinct origins in every environment.

## Trigger scheduled work

Cloudflare's current local Explorer API can invoke the scheduled handler. For example,
with dev running, use Node's fetch to send a chosen UTC timestamp:

```sh
node --input-type=module -e 'const response = await fetch("http://app.localhost:5174/cdn-cgi/local/explorer/api/local/scheduled?worker=trailerdesk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cron: "*/15 * * * *", scheduled_time: Date.now() }) }); console.log(response.status, await response.text());'
```

The 15-minute sweep runs on every invocation. Daily aging/stale work and morning mail
run at the configured dealership-local hours; choose `scheduled_time` accordingly.
Summary email keys include the dealership and local date, so repeating a run does not
send another summary. Open `/cdn-cgi/local/explorer` for the local resource dashboard.
See [Cloudflare cron testing](https://developers.cloudflare.com/workers/configuration/cron-triggers/#test-cron-triggers-locally).
