# Ask and dealership documents

Find answers from dealership records and published policies, with sources to open.

## User flow

Owners and Managers upload PDF or Markdown documents and choose visibility. The queue extracts text, chunks and embeds it. Ask searches inventory, policies and, for staff, customer purchases.

## Business rules

Every tool validates input and queries the active dealership. Sales cannot retrieve cost or management-only documents. Public tools omit customers and internal fields. Retrieval checks current source visibility. Missing evidence produces an admission, not a fabricated answer. Scanned PDFs need selectable text before upload.

## Code

server/features/search/; server/platform/ai.ts; app/components/search/; app/routes/documents.tsx; app/routes/ask.tsx

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.
