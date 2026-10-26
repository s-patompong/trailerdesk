# ADR 0003: Hyperdrive and Postgres

Date: 2026-10-26. Status: accepted within the requested design.

## Context

The app needs relational sales data, full-text search and vector search in one datastore.

## Decision

Use Postgres with pgvector and Drizzle migrations. DB is uncached; DB_CACHED is reserved for public pages and dashboards. Create and close pg clients per request or job.

## Consequences

Hyperdrive pools transactions. Do not rely on session state, temporary tables or session advisory locks. Local caching is not proof of production cache behavior. Test against a separate Postgres database.

## Sources

- https://developers.cloudflare.com/hyperdrive/
- Relevant implementation and tests are indexed in the product feature guides.
