# Public dealership site

Let shoppers browse current trailers and contact the dealership.

## User flow

Open /d/:slug, filter inventory, open a trailer and submit an availability or quote
inquiry. A dealer can also place the versioned `/embed/v1.js` loader on an existing
website. It creates an isolated TrailerDesk iframe using the dealer's public form key.
Turnstile verification and rate limiting protect both submission paths.

## Business rules

Public projections omit cost, lot location, customer records, internal dealership IDs
and assignments. Published pages and form configuration use DB_CACHED with a short cache
lifetime; submissions resolve the public key and recheck configuration with DB. Allowed
parent origins become the iframe's `frame-ancestors` policy. The queue matches a customer,
creates one lead per request ID and sends two emails.

## Code

server/features/public-site/; server/jobs/queue.ts; app/routes/public-*.tsx;
app/routes/embed-form.tsx; public/embed/v1.js

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.
