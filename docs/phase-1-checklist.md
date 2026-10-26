# Phase 1 tracker

Status: local verification passed and Phase 2 was completed later. The production-readiness
extension below is locally verified. No persistent cloud resources are provisioned and no
deployment is claimed. Read the [reports](README.md) for external-account checks and
explicit limitations.

- [x] Current stable dependencies pinned and upstream changes recorded
- [x] Guardrails: strict TS, ESLint, format, knip, duplication, architecture, secrets, hooks
- [x] Documentation, ADRs, issue/PR templates, CI configuration and dependency updates
- [x] Single workerd entry, all bindings, validated Env, local Postgres and test DB
- [x] Better Auth: password, verification, reset, optional Google, organizations and invitations
- [x] Central tenant scoping and server permissions, isolation tests and audit log
- [x] Inventory, filters/views, photos, vPIC cache and AI draft
- [x] Public SSR pages, Turnstile inquiry, queue processing and emails
- [x] Customers, lead board/list, assignment, notes and history
- [x] Exclusive holds, conflict, extend/release, alarms and safety sweep
- [x] Integer-cent quotes, branded PDF and email
- [x] Idempotent sold workflow, progress, fast local timing
- [x] Documents, chunking, embeddings, hybrid retrieval and cited staff tools
- [x] Public chat limited to public data
- [x] Cron aging/stale flags and summary emails
- [x] Dashboard, settings, staff administration and failed job retry
- [x] Realistic seed with second tenant and embedded policies
- [x] Browser checklist verified as all roles, desktop and mobile
- [x] `pnpm check` and build pass with zero warnings
- [x] Phase 1 report with limitations and simplifications, then stop

## Evidence and blockers

- 2026-10-26: workspace initially empty (`ls -la`); not a Git repository.
- Node 24.15.0 and Docker 29.8.2 available. Docker requires sandbox escalation.
- Current docs use React Router v8 and `@cloudflare/vitest-plugin`.
  User explicitly approved following current recommended tooling over the older brief.

## Final local evidence

- `pnpm check`: 18 workerd/test-Postgres tests pass, with zero warnings,
  no architecture violations and 0.70% duplication (3% limit).
- `pnpm test:e2e`: all 26 Chromium tests pass together in 3.0 minutes.
- Real vPIC, Workers AI drafts/citations/actual prices, Mailpit messages, PDF extraction
  and embeddings, Queue/DLQ, DO alarms, fast Workflow and manual cron were exercised.
- Sales can change availability without injecting create defaults or changing cost/description.
- Production SSR build and idempotent seed rerun pass. Secret scan passes; its negative
  control fails on the synthetic token as expected.
- Current config/service-selection guidance, feature guides and eight ADRs are present.
- GitHub CI execution and production integrations remain in their later phases.
- See [the report](phase-1-report.md) for exact scope, simplifications and environment incident.

## Production-readiness extension evidence

- 2026-10-27: Docker, Node tools and the local Worker share `.env` as one local source of
  truth. Both Hyperdrive bindings use Cloudflare's documented environment override names.
  Additive migration `0004` and the idempotent seed passed.
- The versioned `/embed/v1.js` iframe flow derives the dealership from a server-owned public
  form record, applies an allowlisted `frame-ancestors` policy, validates with shared Zod
  schemas and Turnstile, rate limits submission, and queues an idempotent tenant-bound lead.
- Dashboard middleware establishes the verified user, dealership and role once per request.
  Its operational reads use uncached `DB`; cached Hyperdrive remains limited to public or
  explicitly stale-tolerant reads.
- `pnpm check`: 22 Worker/service tests and 1 component test pass with zero warnings,
  no architecture violations across 250 modules/1,183 dependencies, and 0.96% duplication.
- `pnpm build`: production client and Worker SSR bundles pass. Focused Playwright proof:
  embedded client validation/Queue/lead flow plus Owner, Manager and Sales dashboard/settings,
  4 tests passed. `pnpm secrets:check` reports no leaks.
