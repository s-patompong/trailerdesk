# ADR 0006: Automatic quality guardrails

Date: 2026-10-26. Status: accepted within the requested design.

## Context

AI-written code needs enforceable boundaries and reviewable changes.

## Decision

Use typed ESLint flat config, strict TypeScript, Prettier, Knip, jscpd, dependency-cruiser, conventional commit hooks and an offline secret scanner. pnpm check is mandatory.

## Consequences

Do not weaken thresholds or add broad ignores to obtain green checks. Generated shadcn components are an intentional UI library; migrations/generated types are excluded from duplication checks. Scanner rules and the container digest are reviewed together.

## Sources

- https://typescript-eslint.io/users/configs/
- Relevant implementation and tests are indexed in the product feature guides.

## Secret scanner update

The Gitleaks maintainer describes Gitleaks as feature complete with security fixes,
with active new work in Betterleaks. Follow the user's instruction to use the current
recommended successor: Betterleaks 1.9.0, pinned by container digest. Do not use the
2.0 release candidate. Hooks and CI use the same offline scanner; runtime credential
validation is disabled and the container has no network. Exact published local demo
credentials are narrowly allowed, while a synthetic token negative control must fail.
Checked 2026-10-26 against the upstream repositories and stable release.

- https://github.com/gitleaks/gitleaks
- https://github.com/betterleaks/betterleaks
- https://github.com/betterleaks/betterleaks/releases/tag/v1.9.0
