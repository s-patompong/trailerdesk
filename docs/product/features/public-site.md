# Public dealership site

Let shoppers browse current trailers and contact the dealership.

## User flow

Open /d/:slug, filter inventory, open a trailer and submit an availability or quote inquiry. Turnstile verification and rate limiting protect the form.

## Business rules

Public projections omit cost, lot location, customer records and assignments. Published pages use DB_CACHED with a short cache lifetime; submissions recheck eligibility with DB. The queue matches a customer, creates one lead per request ID and sends two emails.

## Code

server/features/public-site/; server/jobs/queue.ts; app/routes/public-*.tsx

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.
