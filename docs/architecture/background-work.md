# Background work

Implemented handlers live in `server/jobs/`, `server/workflows/` and `server/do/`.
See the Phase 1 tracker for verification status.

- Queues accept inquiries and document/trailer embedding jobs. Consumers validate a
  discriminated Zod message schema, persist idempotency keys and retry transient failures.
- The DLQ consumer stores failed messages for a manager-visible retry page.
- `TRAILER_HOLD` is one SQLite-backed Durable Object per trailer. It serializes hold
  commands, persists ownership/expiry and uses an alarm. Postgres is a reporting mirror.
- `DEAL_CLOSING` runs idempotent sale/PDF/email steps with durable sleeps. Fast timing
  is permitted only outside production.
- Cron runs the 15-minute overdue-hold safety sweep and daily aging/stale summaries.

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
