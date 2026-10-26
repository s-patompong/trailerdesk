# Leads and customers

Track the people and conversations behind each sale.

## User flow

View the lead board or list, drag a card or change its stage with the keyboard, assign a salesperson, add notes and open customer history. Add a customer before building a quote.

## Business rules

Stages are New, Contacted, Quoted, Won and Lost. Assignees must belong to the active dealership. Notes and stage changes refresh activity and clear stale flags. Customer matching uses dealership plus email.

## Code

server/features/leads/; server/features/customers/; app/routes/leads.tsx; app/routes/lead-detail.tsx; app/routes/customer*.tsx

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.
