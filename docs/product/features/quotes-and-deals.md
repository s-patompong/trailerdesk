# Quotes and deals

Prepare a clear price and finish the sale with customer follow-up.

## User flow

Build a quote with a trailer, customer, up to eight options, fees, trade-in and tax. Open or email the PDF. Mark the deal sold and watch follow-up progress.

## Business rules

All amounts are integer cents; tax uses basis points and explicit half-up rounding. The quote snapshots agreed details. Customer PDF links use unguessable tokens, a dealership scope and no-store headers. Closing steps retry; permanent email delivery records and Resend keys prevent ordinary replay duplicates.

## Code

server/features/quotes/; server/features/deals/; server/workflows/deal-closing.ts; server/platform/pdf.ts; app/routes/quote*.tsx; app/routes/deal*.tsx

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.
