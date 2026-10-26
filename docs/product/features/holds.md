# Customer holds

Reserve one trailer for one customer without double booking.

## User flow

Choose a customer on an available trailer. A competing salesperson sees the current holder and expiry. Owners and Managers can extend or release it.

## Business rules

The Durable Object serializes commands and uses a persistent alarm. Postgres keeps the hold ledger and a unique active-hold backstop. Release retries cannot clear a newer hold. Duration comes from typed config, normally 48 hours; demo timing is shorter. Cron sweeps overdue holds.

## Code

server/do/trailer-hold.ts; server/features/holds/; app/components/inventory/hold-panel.tsx

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.
