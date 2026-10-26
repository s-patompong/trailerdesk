# TrailerDesk

US trailer dealership software: inventory, customers, leads, quotes, holds and sales,
with a public inventory site. USD integer cents; UTC storage; dealership-local display.

## Work and commands

- Read `docs/phase-1-checklist.md` before continuing work. Mark verified work with evidence.
- `pnpm dev`: local workerd app. `pnpm db:up`: local pgvector Postgres.
- `pnpm db:migrate`, `pnpm db:seed`: local data setup. Never reset persistent databases.
- `pnpm check`: types, lint, formatting, dead code, duplication, architecture, tests.
- `pnpm build`, `pnpm test:e2e`: production bundle and browser verification.
- Use current installed package docs and official upstream guides. Record version changes.
- Phase 1 is local only. Stop for user approval before Phase 2 or Phase 3.
- Never create cloud resources or deploy without explicit user approval.

## Architecture

- One repo, one Worker, one `wrangler.jsonc`, entry `server/index.ts`.
- Hono owns `/api/*`; all other requests fall through to React Router SSR.
- `app/`: thin routes and UI, never DB or repository imports.
- `server/api/`: validate input, call services, map responses.
- `server/features/<name>/`: schemas, services, repositories, colocated tests.
- Repositories access DB only; never import services.
- Features communicate through services only. `platform/` imports no features.
- `server/platform/`: auth, tenant scope, permissions, DB, env, AI, email, storage.
- `server/jobs/`, `server/workflows/`, `server/do/`: background entry points call services.
- `drizzle/`: reviewed migrations. Tests belong beside features or `tests/e2e/`.
- dependency-cruiser enforces boundaries and rejects cycles.

## Data and security

- Every business row has `dealership_id`. All tenant predicates come from the
  central tenant helper; no ad hoc dealership filters in repositories.
- Derive staff tenant context from a verified session and organization membership.
  Never trust a client-provided dealership or role.
- Enforce authorization in the permission module on the server; hiding UI is insufficient.
- Sales must never receive dealer cost, margin or aggregate inventory value.
- Scope child lookups and validate referenced parent rows within the same tenant.
- Zod validates every external boundary, including jobs, workflow params and AI tools.
- Use typed domain errors and the central HTTP mapper. Plain dealership wording.
- Create Postgres clients per request/job from Hyperdrive; never module singletons.
- `DB` for writes, authentication, operational dashboards and read-after-write.
  `DB_CACHED` is only for public or explicitly stale-tolerant reads.
- Hyperdrive is transaction pooled: no session state, temporary tables, LISTEN,
  session advisory locks, or session-level SET. Use explicit transactions.
- Queue delivery and workflow retries are at least once. Persist idempotency keys.
- AI retrieval and tool queries must enforce tenant, visibility and role boundaries.
- Evaluate AI answer correctness against real records, not just HTTP success/citations.
  Model changes must verify current tool support, pricing and role/privacy boundaries.
- Public chat receives public inventory and approved documents only.
- Read runtime configuration through T3 Env + Zod in `server/platform/env.ts`; do not
  scatter raw env reads, fallbacks or secret handling through features. Local mail
  defaults to Mailpit, staging to Mailtrap Sandbox, and production to Resend. Explicit
  drivers override defaults; local Mailtrap is supported. Use grouped typed config in
  `server/platform/config/`; never return the whole config to the browser.
- No committed secrets. Local tools and the Worker share `.env`; copy `.env.example`.
  Production values and secrets live in Cloudflare, never in the repository.

## Choosing services and libraries

- Before proposing custom code for critical or complex capabilities (authentication,
  payments, email delivery, configuration/env handling, storage, search, etc.), check available managed services
  and established libraries, even for infrastructure helpers. Prefer a suitable maintained solution over rebuilding it.
- Verify current official guidance, supported versions, release/changelog activity,
  security support and deprecation notices. Popularity or an old tutorial is not proof
  of maintenance. Record evidence and uncertainty; do not recommend an abandoned option.
- Compare the practical fit: required behavior, security, tenant/role support, runtime
  compatibility, cost, operational burden and data portability. Explain the tradeoff
  and recommend the simplest suitable option before adding a major dependency.
- Small, straightforward application logic may stay in local code. Custom critical
  infrastructure needs a concrete reason existing options do not fit, documented in an ADR.
- Carry this rule into agent instructions when copying this repository for a new project.

## Code and review

- Strict TypeScript. No `any`; avoid assertions and non-null assertions.
- Small focused files/functions; YAGNI, KISS, pragmatic DRY. No unrelated rewrites.
- Pass a simplicity gate before adding structure: identify the current requirement,
  show why the existing path cannot meet it, and choose the fewest concepts and sources
  of truth that solve it. Do not add a provider, adapter, configuration layer, generic
  helper or extension point for a hypothetical future need.
- Prefer one obvious workflow. Add a second implementation only for a current use case;
  then extract the smallest shared boundary that removes meaningful duplication without
  hiding control flow. Delete obsolete paths and documentation in the same change.
- Prices and totals are integer cents. Tax uses integer basis points and explicit rounding.
- Do not weaken quality checks or skip tests to obtain a green result.
- Tests cover security, money, state transitions and retry behavior.
- Conventional commits. Preserve unrelated work; no worktrees unless requested.
- State facts with file/symbol/test evidence; distinguish inference.
- Before edits, inspect implementation, summarize current behavior and give a focused plan.
  Ask before broad architectural changes outside the authorized design.

## Pull requests and review

- `check` is the required fast CI gate for every PR: secrets, migrations, `pnpm check`
  and build. Full Playwright E2E is local or manually dispatched when the changed flow
  warrants it; it is not an automatic PR gate.
- Follow `REVIEW.md` and the PR template. State scope, risk, exact verification and a
  rollback path. Findings need file/line evidence and every thread needs a resolution.
- Review has at most three rounds. Round one covers the whole diff; rounds two and three
  cover the new diff and prior findings. After round three, stop and rethink, split or
  escalate instead of looping.
- Human approval is bound to an exact commit. Later code/configuration changes require
  fresh approval. A bot never replaces a required person.

## Design intent

- TrailerDesk is a reference for project structure, boundaries, validation, security,
  testing and operational patterns. Its visual design is a polished demo, not a design
  system that copied projects must preserve.
- For this repository, keep the established shadcn/Tailwind implementation consistent.
  For a derived project, first ask whether the user has a design language or references.
  Screenshots, Figma files, brand guides, tokens and examples of responsive/error/empty
  states take precedence over TrailerDesk's colors, typography, spacing and composition.
- Preserve accessibility, validation and server-security behavior while adapting visuals.
  Do not infer an entire design system from one screenshot or copy third-party assets
  without permission. See `docs/guides/adapting-the-ui.md`.

## Definition of done

`pnpm check` passes with zero warnings, relevant tests and build pass, changed user flows
receive appropriate local or manually dispatched E2E verification, docs reflect actual
behavior, and limitations are explicitly listed. Never label scaffolding or mocked
integration checks as complete features.

## Documentation

- `docs/README.md`: index and guide map.
- `docs/product/`: business flows, glossary, permission matrix.
- `docs/architecture/`: request flow, tenancy, background work and AI boundaries.
- `docs/decisions/`: major choices and current-tool deviations.
- `docs/guides/`: local setup, tests, deployment, troubleshooting and feature recipe.
