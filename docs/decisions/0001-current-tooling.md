# ADR 0001: Current stable integrations

Date: 2026-10-26. Status: accepted by user instruction.

## Context

The original brief specified React Router 7 and the Workers Vitest pool package.
The user explicitly requested current recommended guidance over old versions.

## Decision

Use React Router 8 framework SSR and Cloudflare's Vite plugin. Use the current
`@cloudflare/vitest-plugin` / `cloudflareTest()` integration with Vitest 5.
Use stable npm releases, pinned exactly; do not follow Drizzle's RC installation
example until it is a stable release. Use ESLint flat config and typed linting.
AI SDK 7 uses Cloudflare createAI from agents/models/ai-sdk. The old
workers-ai-provider package is deprecated; the replacement API is marked beta.
TypeScript 6 is the newest stable release supported by typescript-eslint.
ESLint 10 uses the official compatibility adapter for older React/a11y plugins;
their peer metadata still stops at ESLint 9. Runtime checks must verify compatibility.
Keep Postgres 17 / pgvector as the explicitly requested local database baseline.

## Sources

- https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/
- https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/
- https://github.com/cloudflare/ai/tree/main/packages/workers-ai-provider
- https://typescript-eslint.io/users/configs/
- https://orm.drizzle.team/docs/get-started-postgresql

## Consequences

Agents must read installed docs and peer constraints rather than paste older APIs.
Version changes are deliberate and recorded here. No extra runtime or second Worker.

- https://developers.cloudflare.com/agents/models/ai-sdk/
- https://eslint.org/blog/2024/05/eslint-compatibility-utilities/
