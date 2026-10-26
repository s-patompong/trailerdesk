# ADR 0002: Single Worker

Date: 2026-10-26. Status: accepted within the requested design.

## Context

SSR pages, API requests and background work must share one deployment and one binding configuration.

## Decision

Use one server/index.ts entry. Hono handles /api/* and React Router handles other paths. Export queue, scheduled, TrailerHold and DealClosing from that same entry.

## Consequences

Feature services are reusable from HTTP and background handlers. Runtime-specific entry points stay thin; do not create separate API or job Workers.

## Sources

- https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/
- Relevant implementation and tests are indexed in the product feature guides.
