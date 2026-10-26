# Phase 1 local report

Date: 2026-10-26. Local verification passed. Stopped before Phase 2. No GitHub push or deployment.

## Implemented and exercised locally

- Single workerd entry: React Router SSR, Hono, Hyperdrive, KV, R2, Queues/DLQ,
  SQLite Durable Object alarms, Workflow, cron, remote Workers AI and public rate limiting.
- Better Auth password login, email verification/reset and organization invitations.
  Staff roles, dealership switching, server permission enforcement and audit records.
- shadcn inventory cards/table, filtering, add/edit, vPIC prefill, photos/cover selection
  and an editable real AI listing draft. Original photographic demo assets are bundled.
- Public SSR inventory, Turnstile inquiry, tenant-scoped customer matching, queued leads
  and captured shopper/salesperson emails in Mailpit.
- Customer history including inquiries, quotes and purchases; notes, assignment and
  lead board/list with drag/drop and keyboard stage controls.
- Exclusive holds, simultaneous conflict, manager extend/release and automatic expiry.
- Integer-cent quotes, add-ons/tax/fees, PDFs, quote email, sold Workflow with progress,
  bill of sale and fast local follow-up emails. Replay produces one close audit record.
- PDF/Markdown document indexing via R2, Queue, extraction, embeddings and hybrid retrieval.
  Staff citations, Sales cost restrictions and public/private document boundaries.
- Dashboard management visibility, owner settings, staff invitations, nightly flags,
  morning summaries and failed-job retry after real Queue/DLQ exhaustion.
- Typed grouped configuration with environment defaults and explicit driver overrides.
  Local Mailtrap is supported; T3 Env/Zod reject incomplete or unsafe provider settings.

## Verification evidence

- `pnpm check`: passed with 18 workerd tests against the separate test Postgres and
  zero warnings. dependency-cruiser reports no violations across 240 modules/1,132
  dependencies. Duplication is 0.70%, below the 3% threshold.
- `pnpm test:e2e`: all 26 Chromium tests passed together in 3.0 minutes. This includes
  live AI with actual-price assertions, role/tenant boundaries, Sales status-only updates,
  verification/reset links, PDF/indexing, Queue/DLQ, hold alarms, Workflow, cron and UI validation.
- `pnpm build`: passed, including the SSR Worker bundle; no build warnings.
- `pnpm db:seed`: rerun successfully without resetting the persistent database.
- `pnpm secrets:check`: passed. A synthetic-token negative control failed as expected,
  identified its owned fixture, and the fixture was removed.
- Mailpit transport and captured messages were verified live. The official Mailtrap and
  Resend SDK transports were verified with HTTP mocking in workerd, not hosted inbox delivery.
- Desktop and phone inventory screenshots were visually inspected. An owned stale
  trailer fixture from an earlier test was removed; the primary demo inventory has 40 trailers.

Commands write local evidence to `test-results/` and the current operator's temporary
logs. Browser traces contain local cookies/reset links and must not be published.
The exact new files are listed in [the source manifest](phase-1-files.txt); feature guides map behavior to code.

## Current-tool updates

- React Router 8 framework mode follows the current Cloudflare guide instead of the
  older v7 brief. Current Workers testing uses `@cloudflare/vitest-plugin` with Vitest 5.
- `agents/models/ai-sdk` replaces deprecated workers-ai-provider; its adapter is beta.
  The configurable default model is gpt-oss-120b after real price/tool evaluations.
- Betterleaks replaces feature-complete Gitleaks, following the maintainer's successor;
  the scanner runs from a digest-pinned container without network access.
- TypeScript 6 is the newest stable version supported by the installed typed linter;
  unsupported TypeScript 7 is not forced into the quality toolchain.
- T3 Env, native Mailpit capture, official Mailtrap/Resend SDKs and maintained Markdown
  packages follow the added configuration/service-selection requirements.

See ADRs [0001](decisions/0001-current-tooling.md),
[0006](decisions/0006-automated-guardrails.md),
[0007](decisions/0007-configuration-and-mail.md) and
[0008](decisions/0008-grounded-ai.md) for sources and tradeoffs.

## Simplifications and limits

- Google, Anthropic, Mailtrap's hosted inbox and Resend delivery need real credentials.
  Google is conditional and wired; local verification uses passwords as requested.
  These external integrations are not claimed as live-account verified.
- Cloud Hyperdrive query caching, production rate limits, production Turnstile and
  live Cloudflare deployment behavior require Phase 3. Local caching is not a simulation.
- The Ask panel handles one question at a time with citations; it does not persist a
  multi-turn conversation. Shoppers open a cited trailer's inquiry form to contact staff.
- VIN decoding fills reliable available fields. A vPIC GVWR class/range is not converted
  into an invented exact weight; staff confirm the trailer plate.
- Demo images are original generated photographic illustrations by trailer type,
  clearly labeled. They are not photographs of the particular fictional VIN/stock item.
- Quote/bill email uses a private, unguessable PDF link rather than an attachment.
  PDFs currently use standard Helvetica and a compact US-letter layout; arbitrary
  international scripts and extreme text lengths need a font/layout enhancement.
- Delete and billing permissions are reserved policy entries. This build exposes no
  general record-deletion or billing workflow. Existing sales/history are retained.
- A provider acceptance and a Postgres commit cannot be atomic. The email ledger handles
  normal replay/concurrency; sandbox capture can duplicate in the crash gap. Old ambiguous
  sends stop for review rather than risking a second real delivery outside the key window.
- Local browser tests retain captured mail and R2 files for inspection. Trailer, document,
  account and CRM fixtures clean up owned rows; old inquiry/quote test history may remain.
- The upstream Workers AI AI SDK adapter is marked beta. A narrow pnpm patch removes
  only a broken upstream sourcemap comment; see troubleshooting and ADR 0001.

## Environment incident

An early Homebrew gitleaks install triggered Homebrew's automatic cleanup, which attempted
unrelated old php@8.0 directories and reported permission errors. No repair/cleanup of
those directories was attempted afterward. Active Herd PHP 8.5.12 was verified working;
the old Homebrew tree's prior state is unknown. The project now uses a pinned scanner
container and requires no further Homebrew install or cleanup.

## Next phase boundary

Phase 2 requires the user's repository name/visibility and permission to proceed.
Do not push, provision resources or deploy as part of this local phase.
