# TrailerDesk

Trailer dealership software built with React Router, Hono and Cloudflare Workers.
**Local and GitHub CI verification pass.** See the [Phase 1](docs/phase-1-report.md)
and [Phase 2](docs/phase-2-report.md) reports for evidence and limitations. Cloudflare
deployment remains a separate, approval-gated phase.

This repository demonstrates application structure, security, validation, testing and
operations. Its visual design is only a polished example; derived projects should follow
the user's own design language and supplied references. See the
[UI adaptation guide](docs/guides/adapting-the-ui.md).

## Local quick start

Use Node from `.nvmrc`, Docker and pnpm (Corepack reads the pinned package manager).

```sh
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm exec wrangler login
pnpm db:seed
pnpm dev
```

Open [TrailerDesk staff locally](http://app.localhost:5174). Platform administration uses
[`admin.localhost`](http://admin.localhost:5174/login), while public inventory and forms use
[`localhost`](http://localhost:5174/d/ridgeline). The Cloudflare account needs a
workers.dev subdomain for remote AI development. Other bindings remain local.
No deployment or cloud resource creation is part of these commands.

Open the [embedded-form example](http://localhost:5174/embed-demo.html) to see the
versioned iframe loader, public configuration, validation and queued lead flow.

Local-only accounts: `owner@trailerdesk.test`, `manager@trailerdesk.test`,
`sales@trailerdesk.test`. All use **`TrailerDesk-Local-2026!`**. Never seed these into production.
The separate platform realm uses `platform-admin@trailerdesk.test` with the same local-only
password.

```sh
pnpm check
pnpm build
pnpm test:e2e
```

[Documentation](docs/README.md) · [Agent guide](AGENTS.md) · [Product overview](docs/product/overview.md)
