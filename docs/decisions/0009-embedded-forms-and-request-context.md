# ADR 0009: Isolated embedded forms and request-scoped staff identity

Date: 2026-10-26. Status: accepted by user instruction.

## Context

The expected initial production shape is about 14 dealerships, multiple staff per
dealership, more than 50 daily staff users, and forms embedded on dealer-owned websites.
The reference must show a secure multi-tenant flow without requiring one deployment per
dealer or frequent dashboard polling.

## Decision

Keep one Worker and shared-schema Postgres. Use a versioned loader that creates a
TrailerDesk-hosted iframe. Resolve a rotatable public form key to one dealership on the
server, restrict parent origins with CSP, and enqueue validated submissions. Do not put
internal dealership IDs or secrets in embed configuration.

Use React Router's installed typed middleware context to establish staff identity once
for the dashboard request. Operational dashboard reads use uncached Hyperdrive because
cached queries are not invalidated after writes. Public inventory and form configuration
may use the cached binding. Prefer action-driven revalidation over constant polling.

## Consequences

The iframe is consistent, accessible and insulated from dealer-site dependencies, but
dealers cannot directly restyle its internal markup. Public form copy and allowed origins
are database configuration. A native-DOM integration would be a separate reviewed
adapter. Workers Paid and managed Postgres are recommended for real dealers; the local
reference does not provision or prove cloud infrastructure.

## Sources

- https://reactrouter.com/how-to/middleware
- https://developers.cloudflare.com/hyperdrive/concepts/query-caching/
- https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/
- https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/
- https://developers.cloudflare.com/workers/platform/pricing/
