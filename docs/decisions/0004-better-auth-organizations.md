# ADR 0004: Better Auth and dealerships

Date: 2026-10-26. Status: accepted within the requested design.

## Context

Staff need verified accounts, resets, Google login and membership in multiple dealerships with three roles.

## Decision

Use the maintained Better Auth library and its organization plugin from the accepted stack. Keep application permissions in one module and validate membership for each business request.

## Consequences

Authentication protocols and password handling remain in Better Auth. New projects must evaluate managed offerings such as Clerk and current libraries against their own needs; this choice is not a universal recommendation or a claim that another provider cannot fit.

## Sources

- https://better-auth.com/docs/plugins/organization
- Relevant implementation and tests are indexed in the product feature guides.
