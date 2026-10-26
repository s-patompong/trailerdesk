# TrailerDesk code review

Review asks whether the change solves its stated dealership problem, fits the system and
introduces a correctness, security or operational regression. It is not a style contest.
Read `AGENTS.md`, the PR intent and the actual diff before reviewing.

## Required evidence

- Cite a file and line for every finding. Distinguish an observed defect from an inference.
- Start the review summary with the finding count. Say `0 findings` when nothing is actionable.
- Classify findings as `Blocker`, `Important`, `Nit` or `Pre-existing`.
- Drop pure cleanup and personal-preference comments. Cap useful nits at three.
- A finding must describe the failure, affected user or system boundary, and a concrete fix
  or verification path.

Review these boundaries first: tenant isolation, server permissions, Sales cost privacy,
integer-cent money, idempotent background work, validation, secrets, AI grounding and
public/internal data separation. For docs, failure means the document contradicts the
code or verified operation. For configuration, failure means it can misroute, expose or
silently disable behavior.

## Risk and approval

The change determines risk, not the author:

| Tier   | Typical changes                                                                | Human review                      |
| ------ | ------------------------------------------------------------------------------ | --------------------------------- |
| Low    | Docs, copy, tests, or small additive behavior with no sensitive boundary       | Optional after required checks    |
| Medium | Ordinary product, data access or operational behavior                          | One person                        |
| High   | Auth, tenancy, roles, money, migrations, secrets, AI privacy, CI or deployment | Two people when the team has them |

Bots may report findings but never fill a required human approval slot. When only one
human is available for a high-risk change, record that limitation, obtain explicit owner
sign-off, strengthen focused tests and make rollback concrete. Sensitive paths are listed
in `.github/CODEOWNERS`.

Approval applies to one exact commit. A later code or configuration commit requires a new
approval. Every open review thread must be fixed or resolved with a short reason.

## Three-round convergence rule

1. Round one reviews the whole diff against the PR intent and relevant repository context.
   Look for root causes and all instances of the same bug class.
2. Rounds two and three review only what changed since the previous reviewed commit plus
   whether earlier findings were resolved. Do not repost an unchanged finding.
3. After round three, stop. If important findings remain, reconsider the approach, split
   the PR or ask for human architectural direction. Do not begin a fourth review/fix loop.

The priority is catching real defects. Reducing rounds is secondary and must never be
achieved by suppressing a valid security or correctness finding.

## Author handoff

Before requesting review, the author provides:

- the dealership outcome and explicit scope;
- the risk tier and likely failure mode;
- exact test/build commands and their results;
- screenshots or runtime evidence for changed UI behavior when relevant;
- a concrete rollback path and irreversible data effects;
- the review round number and exact commit SHA.

The author owns the result after merge and normally leads any fix or revert because they
hold the freshest context.

## Source

This lightweight policy adapts the layered, evidence-first and convergent review practices
described in [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/).
TrailerDesk keeps the parts suitable for a small public reference repository; it does not
claim Anthropic's internal automation, classifiers or staffing.
