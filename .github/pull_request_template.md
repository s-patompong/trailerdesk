## Dealership outcome

Describe the problem and resulting behavior. Include a concrete example if helpful.

## Scope

State what is included and explicitly out of scope. Link the issue or decision when one
exists.

## Risk

- [ ] Low: docs, copy, or a small additive change
- [ ] Medium: ordinary product or operational behavior
- [ ] High: auth, tenancy, permissions, money, migrations, secrets, AI privacy, CI, or release

Explain the chosen tier, blast radius and the most likely failure mode.

## Testing evidence

List the exact commands and results. Attach screenshots or logs when they prove behavior.
Do not write only “tests pass.”

- [ ] `pnpm check` passes with zero warnings
- [ ] `pnpm build` passes
- [ ] Relevant local or manually dispatched browser checks pass, or are marked not needed
- [ ] Tenant and role boundaries are covered
- [ ] Tests and documentation updated
- [ ] ADR added or updated if architecture changed
- [ ] No secrets or customer data committed

## Review record

- Review round: 1 / 2 / 3
- Exact commit reviewed:
- [ ] Every finding is fixed or resolved with a reason
- [ ] New commits after approval receive a new approval

Review stops after round three. If important findings remain, split, redesign or escalate
the change instead of starting a fourth loop. See `REVIEW.md`.

## How to revert

Give a concrete rollback or disable path and note any data that cannot be reversed.

## Limitations

State anything that could not be verified and how to check it.
