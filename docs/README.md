# TrailerDesk documentation

Start with the [Phase 1 tracker](phase-1-checklist.md), [local verification report](phase-1-report.md)
and [GitHub/CI report](phase-2-report.md), which distinguish implemented behavior,
evidence and limitations.

- Product: [overview](product/overview.md), [glossary](product/glossary.md), [roles](product/roles-and-permissions.md)
- Architecture: [overview](architecture/overview.md), [data model](architecture/data-model.md), [background work](architecture/background-work.md), [AI](architecture/ai.md)
- Decisions: [current tooling](decisions/0001-current-tooling.md), [ADR template](decisions/template.md)
- Guides: [configuration](guides/configuration.md), [local development](guides/local-development.md), [testing](guides/testing.md), [deployment](guides/deployment.md), [adding a feature](guides/adding-a-feature.md), [adapting the UI](guides/adapting-the-ui.md), [choosing maintained services](guides/choosing-services.md), [troubleshooting](guides/troubleshooting.md)

Feature guides describe business flows, rules and code locations:

- [Authentication](product/features/authentication.md), [inventory](product/features/inventory.md), [public site](product/features/public-site.md)
- [Leads and customers](product/features/leads-and-customers.md), [holds](product/features/holds.md), [quotes and deals](product/features/quotes-and-deals.md)
- [AI and documents](product/features/assistant-and-documents.md), [dashboard and daily work](product/features/dashboard-and-daily-work.md)
- [Settings and staff](product/features/settings-and-staff.md), [failed jobs](product/features/failed-jobs.md)

Additional decisions: [single Worker](decisions/0002-single-worker.md), [Hyperdrive/Postgres](decisions/0003-hyperdrive-postgres.md), [Better Auth](decisions/0004-better-auth-organizations.md), [pgvector](decisions/0005-pgvector-hybrid-search.md), [guardrails](decisions/0006-automated-guardrails.md), [configuration and mail](decisions/0007-configuration-and-mail.md), [grounded AI and rendering](decisions/0008-grounded-ai.md).

- UI: [frontend validation](guides/frontend-validation.md), [demo image provenance and prompts](guides/demo-images.md)
