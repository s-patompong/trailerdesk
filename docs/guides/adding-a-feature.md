# Adding a feature

1. Read root and nested AGENTS.md plus relevant product and architecture docs.
2. Inspect existing code. State source evidence, expected behavior and a focused plan.
3. Apply the simplicity gate: name the current requirement, reuse the existing path when
   it fits, and reject configuration, providers, adapters or extension points that serve
   only a possible future. Prefer one source of truth and the smallest coherent change.
4. Before designing critical or complex functionality, compare current maintained services and libraries using the [service-selection guide](choosing-services.md). Explain the fit and tradeoff before proposing a custom implementation. Small application logic can remain local.
5. Put boundary Zod schemas in `server/features/<feature>/<feature>.schemas.ts`.
6. Add repository queries in `<feature>.repo.ts`; use `tenantWhere` for every tenant query.
7. Add business rules and permissions in `<feature>.service.ts`. Validate same-tenant parents.
8. Add thin Hono routes in `server/api/<feature>.routes.ts` and/or SSR loaders/actions.
9. Add accessible feature UI and meaningful pending, empty and error states. In a derived
   project, follow its authoritative design references rather than copying TrailerDesk's
   appearance; see the [UI adaptation guide](adapting-the-ui.md).
10. Add tests for authorization, cross-tenant IDs, invalid input and important state transitions.
11. For background effects, define an idempotency key, validate messages and test replay.
12. Update product/architecture docs and the phase tracker. Write an ADR for major choices.
13. Run `pnpm check`, `pnpm build` and relevant browser tests. Report actual evidence and gaps.

Never bypass a failing guardrail with broad ignores. Never trust a client-supplied role or tenant.
