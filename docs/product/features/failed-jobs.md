# Failed jobs

Find background work that needs another attempt.

## User flow

Owners and Managers open Failed jobs, review the message type and send a failed item for another attempt after fixing its cause.

## Business rules

The dead-letter queue stores tenant-attributable failed messages. Retry preserves the original business idempotency key. The page does not expose raw shopper messages or credentials. A malformed message without a valid dealership needs operator review in Cloudflare logs.

## Code

server/features/jobs/; server/jobs/queue.ts; app/routes/failed-jobs.tsx

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.
