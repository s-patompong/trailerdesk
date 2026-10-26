# Configuration

TrailerDesk separates environment defaults, provider choices and dealership settings.
Use `configuration(env)` from `server/platform/config/` in server code. T3 Env and Zod
validate the values at each handler entry. Never serialize the whole configuration to
an API response or loader; return only the public values the page needs.

## Configuration layers

| Layer                                       | Local source              | Cloud source                  |
| ------------------------------------------- | ------------------------- | ----------------------------- |
| Tools, Worker values and local secrets      | `.env`                    | Wrangler vars and secrets     |
| KV, R2, Queue, AI, Hyperdrive, DO, Workflow | `wrangler.jsonc` bindings | Provisioned binding IDs/names |
| Dealership behavior                         | Postgres settings         | Postgres settings             |

Copy `.env.example` to `.env`. Docker Compose, Node tools and the local Worker share that
single local configuration file. Cloudflare supports either `.env` or `.dev.vars`; this
project deliberately uses only `.env` to keep one local source of truth. The file is never
committed or uploaded as production configuration.

## Mail

| Environment | Default when EMAIL_DRIVER is omitted |
| ----------- | ------------------------------------ |
| development | Mailpit                              |
| test        | Test outbox                          |
| staging     | Mailtrap Sandbox                     |
| production  | Resend                               |

An explicit `EMAIL_DRIVER` takes priority. To use Mailtrap locally, edit `.env`:

```dotenv
EMAIL_DRIVER=mailtrap
MAILTRAP_API_TOKEN=replace-with-your-sandbox-token
MAILTRAP_INBOX_ID=123456
```

Use a token with sandbox access and your own inbox ID. Restart `pnpm dev` after changing
configuration. Mailtrap always uses its sandbox endpoint in this adapter, including
when selected locally. No message is delivered to the named customer address.

To switch back:

```dotenv
EMAIL_DRIVER=mailpit
MAILPIT_URL=http://127.0.0.1:18025
```

`/dev/mail` opens Mailpit's native inbox when selected. The explicit `outbox` driver is
available for isolated tests and local debugging. Cloud environments cannot use the
local inbox or test outbox. Using Resend outside production requires both its API key
and `ALLOW_LIVE_EMAIL=true`, because it sends real messages.

## AI and feature behavior

- `LLM_PROVIDER`: `workers-ai` or `anthropic`.
- `WORKERS_AI_MODEL`, `ANTHROPIC_MODEL`: override model names for the selected provider.
  Workers AI defaults to `@cf/openai/gpt-oss-120b` following local tool/price evaluations.
  Confirm current availability, tool support and pricing before changing them.
- `HOLD_HOURS`: normal hold duration, default 48.
- `CHECK_IN_DAYS`, `REVIEW_AFTER_CHECK_IN_DAYS`: sale follow-up delays, defaults 3 and 30.
- `DEMO_FAST_TIME`: local/staging demo timing; production rejects it.
- `DEMO_HOLD_SECONDS`, `DEMO_CHECK_IN_SECONDS`, `DEMO_REVIEW_SECONDS`: demo timings,
  defaults 30, 3 and 9. The review value is measured from the sale's closing time.
- `LEAD_STALE_DAYS`: inactivity threshold, default 14.
- `AGING_NOTICE_DAYS`, `AGING_WARNING_DAYS`, `AGING_CRITICAL_DAYS`: defaults 60, 90, 120;
  values must increase.
- `NIGHTLY_JOB_HOUR`, `MORNING_SUMMARY_HOUR`: dealership-local hours, defaults 2 and 8.

The supported embedding model and dimensions live in `config/defaults.ts`. Changing
embedding dimensions also requires a reviewed database migration and a full reindex;
changing an env variable alone cannot change a vector column safely.

Tax, default fees, timezone, dealership profile and public-site visibility belong to
each dealership's saved settings. An env change must not silently overwrite existing
business data. The single Worker and its Cloudflare bindings remain infrastructure
configuration in `wrangler.jsonc`.

## Adding a setting

Add its Zod schema and safe default in `server/platform/env.ts` and `config/defaults.ts`,
then expose a named value in the relevant typed config group. Use that value in the
service and in any user-facing explanation of the behavior. Add invalid-value and
override tests, update `.env.example`, and document migration/reindex requirements
when a setting affects stored data. Do not scatter raw env reads or fallback values
through features, and do not add configurable providers that the project does not use.
