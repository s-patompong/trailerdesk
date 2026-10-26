# Overview and daily work

Show a clear picture of the lot and work that needs attention.

## User flow

Open Overview for stock, leads, deals, aging inventory and active holds. Owners and Managers receive a morning summary.

## Business rules

Sales never receive inventory value. Dates use the dealership timezone. Cron checks overdue holds every 15 minutes and uses configured local hours for aging/stale updates and summary mail. Summary keys prevent repeated mail on the same date. Local cron needs a manual trigger.

## Code

server/features/dashboard/; server/jobs/scheduled.ts; app/routes/dashboard.tsx

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.
