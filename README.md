# TrailerDesk

Trailer dealership software built with React Router, Hono and Cloudflare Workers.
**Local verification passes.** See the [Phase 1 report](docs/phase-1-report.md) for verified features and limitations. GitHub and deployment are later phases.

This repository demonstrates application structure, security, validation, testing and
operations. Its visual design is only a polished example; derived projects should follow
the user's own design language and supplied references. See the
[UI adaptation guide](docs/guides/adapting-the-ui.md).

## Local quick start

Use Node from `.nvmrc`, Docker and pnpm (Corepack reads the pinned package manager).

```sh
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:up
pnpm db:migrate
pnpm exec wrangler login
pnpm db:seed
pnpm dev
```

Open [TrailerDesk locally](http://localhost:5174). The Cloudflare account needs a
workers.dev subdomain for remote AI development. Other bindings remain local.
No deployment or cloud resource creation is part of these commands.

Local-only accounts: `owner@trailerdesk.test`, `manager@trailerdesk.test`,
`sales@trailerdesk.test`. All use **`TrailerDesk-Local-2026!`**. Never seed these into production.

```sh
pnpm check
pnpm build
pnpm test:e2e
```

[Documentation](docs/README.md) · [Agent guide](AGENTS.md) · [Product overview](docs/product/overview.md)
