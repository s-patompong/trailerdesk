# Code review

TrailerDesk uses fast automation for routine defects and spends human attention according
to risk. The repository policy lives in [`REVIEW.md`](../../REVIEW.md); this guide explains
how to apply it.

## Before opening a pull request

Keep the change small enough to explain and reverse. Inspect the existing implementation,
verify the behavior, then complete the PR template with:

1. the dealership outcome and explicit scope;
2. a low, medium or high risk tier based on the change;
3. exact commands and results, plus screenshots when they prove UI behavior;
4. the likely failure mode and blast radius;
5. a concrete rollback path, including irreversible data effects.

Run `pnpm check` and `pnpm build`. Run the relevant Playwright files locally when the
change affects a user flow. Full E2E remains available through the manual GitHub workflow,
but it is not a routine PR requirement.

## Automated gate

Every PR runs `.github/workflows/check.yml`. The `check` job installs the locked dependency
graph, scans the tree and Git history for secrets, starts the test Postgres, runs migrations,
executes `pnpm check` (including backend and React component tests), and builds the
production SSR bundle. This is the required status.

Full E2E lives in `.github/workflows/e2e.yml` and runs only by manual dispatch. Select the
reviewed branch or SHA. The workflow needs the Cloudflare secret because Workers AI is a
real remote binding; never expose it to fork or Dependabot PR code.

## Review rounds

- Round 1 reads the full diff, PR intent and relevant system context.
- Round 2 checks only the new diff and resolution of round-one findings.
- Round 3 does the same for round two and is the last round.
- If important findings remain after round 3, stop. Split, redesign or seek human
  architectural direction instead of creating an endless agent-review loop.

Every finding cites a file and line, states the failure and its impact, and distinguishes
fact from inference. Reviewers identify the bug class so authors fix every occurrence.
They do not repeat unchanged findings. All threads are fixed or resolved with a reason.

## Risk-scaled approval

Low-risk docs, copy and small additive changes can merge after required checks when no
human review is required. Medium changes need one person. High-risk auth, tenancy, roles,
money, migrations, secrets, AI privacy, CI and deployment changes need two people when the
team has them. A bot does not count as a human approval.

This public example may have only one active maintainer. In that case, high-risk work must
record the staffing limitation, receive explicit owner sign-off, add focused verification
and retain a clear rollback path. Do not invent a second approval.

Approval covers an exact commit. Dismiss it after later code or configuration commits.
Sensitive paths in `.github/CODEOWNERS` always request the owner's attention.

## GitHub enforcement

The `main` branch requires a pull request, an up-to-date `check` result, resolved review
conversations and linear history. The rule applies to administrators and blocks force
pushes and branch deletion. GitHub currently requires zero approvals because this is a
solo-owned repository; otherwise the owner could not merge their own work. CODEOWNERS
requests attention but is not a mandatory approval gate.

The medium/high-risk human rules above are therefore process policy, not fully enforceable
repository settings today. When another maintainer with write access joins, require the
appropriate approval count and code-owner review in GitHub, then keep stale-approval
dismissal enabled so approval continues to cover the exact reviewed commit.

## Why this policy

Anthropic's article [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/)
describes layered verification, evidence over claims, risk-scaled human review, exact-commit
approval and a three-round convergence cap. TrailerDesk adopts those principles without
pretending to have Anthropic's internal agents, classifiers, merge queue or staffing.

The article's result is not evidence that this policy works for every team. Track review
rounds, escaped defects, reverts and time waiting for a person. Tighten or simplify the
process based on that evidence.
