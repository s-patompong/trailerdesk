# Background work

Implemented handlers live in `server/jobs/`, `server/workflows/` and `server/do/`.
See the Phase 1 tracker for verification status.

## Choose the smallest mechanism

| Need                                      | Mechanism      | TrailerDesk example                        |
| ----------------------------------------- | -------------- | ------------------------------------------ |
| Return quickly and retry independent work | Queue          | Inquiries and search indexing              |
| Start work on a schedule                  | Cron Trigger   | Aging inventory, stale leads and summaries |
| Durable multi-step work with waits        | Workflow       | Deal closing and follow-up email           |
| Serialize commands for one entity         | Durable Object | One active hold per trailer                |

Do not add an in-process scheduler, Redis job framework or second Worker merely to run
background work. These bindings invoke the same deployed Worker through different entry
handlers and scale independently from browser requests.

## Working Queue example

The public inquiry is the reference Queue and email flow:

1. `submitInquiry` validates the request, applies Turnstile and rate limiting, sends a
   small Zod-validated `inquiry` message to `JOBS`, then returns an accepted response.
2. Cloudflare invokes the exported `queue` handler separately. It validates the message,
   creates or matches the tenant-scoped customer and lead, and sends staff and shopper mail.
3. Email delivery uses persistent idempotency keys. The message is acknowledged only after
   processing succeeds; failures retry and eventually reach `JOBS_DLQ`.
4. The manager failed-jobs page can inspect and retry an exhausted message.

Run the focused local proof:

```sh
pnpm test:e2e:background
```

It exercises a real local Queue, lead creation, two Mailpit messages, a scheduled invocation,
aging/stale updates and idempotent morning summaries. It remains a focused manual test rather
than an automatic PR gate.

- Queues accept inquiries and document/trailer embedding jobs. Consumers validate a
  discriminated Zod message schema, persist idempotency keys and retry transient failures.
- The DLQ consumer stores failed messages for a manager-visible retry page.
- `TRAILER_HOLD` is one SQLite-backed Durable Object per trailer. It serializes hold
  commands, persists ownership/expiry and uses an alarm. Postgres is a reporting mirror.
- `DEAL_CLOSING` runs idempotent sale/PDF/email steps with durable sleeps. Fast timing
  is permitted only outside production.
- Cron runs the 15-minute overdue-hold safety sweep and daily aging/stale summaries.

## Inventory feed pattern

Add a feed importer only when one real provider format and authentication method are known.
The first implementation should use the existing `JOBS` Queue:

1. Cron or an authorized staff action enqueues `{ kind, dealershipId, feedId, cursor }`.
   Store credentials in Cloudflare secrets or protected dealership settings, never the message.
2. The consumer fetches one bounded page, validates it with Zod and upserts by
   `(dealership_id, provider, external_id)` inside a transaction.
3. Persist a sync run and item version so retrying the same page is idempotent.
4. Enqueue the next cursor and existing trailer-index messages after the transaction.
5. Let transient errors retry; send exhausted messages to the existing DLQ and admin page.

Messages contain identifiers and cursors, not whole feeds or files. Stream large responses
where possible, cap page/item counts and keep only one page in memory. Do not invent a generic
provider adapter before a second real provider demonstrates shared behavior.

## Memory rules

The 128 MB limit applies to each isolate, not each user or each message. One isolate can
serve concurrent events, and Cloudflare creates or retires isolates according to traffic.
Keep durable state in Postgres, R2, KV, Workflows or Durable Objects, not module globals.
Close per-invocation database clients, avoid unbounded caches, pass R2 keys instead of file
bytes through Queues, process Queue batches sequentially unless measurements support bounded
concurrency, and avoid buffering large provider feeds.

Document PDF indexing is the current highest-memory path because it materializes a bounded
PDF. Upload validation limits files to 10 MB, extraction rejects more than 40 pages, text is
capped, and the Queue processes its batch sequentially. Monitor exceeded-memory outcomes
before raising those limits or adding parallel extraction.

Do not replace these mechanisms with in-memory timers. Persist before acknowledging
queue messages. Provider email uses the permanent `email_deliveries` ledger, with row locking and
content hashes. Resend also receives a provider idempotency key. A provider acceptance
followed by a failed database commit is not atomic: sandbox transports can capture a
duplicate in that crash window. Unsent reservations older than 23 hours require operator
review instead of automatically risking a send beyond Resend's 24-hour key window.

Resend receives a stable SHA-256 digest of the internal key, keeping its header within
Resend's 256-character limit even for long addresses/tokens. Auth callbacks hash tokens
before constructing ledger keys as well; raw reset/verification tokens do not belong
in permanent delivery identifiers. Provider transport tests run with mocked HTTP in
workerd. They do not establish real-domain delivery or inbox placement.
