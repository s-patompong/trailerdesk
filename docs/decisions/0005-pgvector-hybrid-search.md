# ADR 0005: Postgres hybrid search

Date: 2026-10-26. Status: accepted within the requested design.

## Context

Answers need tenant and visibility controls across inventory and dealership policies.

## Decision

Store versioned text chunks, 768-dimensional Workers AI embeddings and generated tsvector values in Postgres. Combine full-text and cosine-search ranks with reciprocal rank fusion.

## Consequences

Current source rows remain the access authority, including after visibility changes. Changing embedding dimensions needs a migration and reindex. Index existence is not a performance benchmark; measure plans and recall before scaling the corpus.

## Sources

- https://github.com/pgvector/pgvector
- Relevant implementation and tests are indexed in the product feature guides.
