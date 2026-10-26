# Phase 2 report

Status: complete. TrailerDesk is in the public
[`s-patompong/trailerdesk`](https://github.com/s-patompong/trailerdesk) repository on
the `main` branch. Phase 3 has not started; no application or persistent Cloudflare
resource was deployed.

## Initial publication history

The repository was published as reviewable conventional commits:

1. `c1ed91f` `chore: establish Cloudflare project guardrails`
2. `27ed4b4` `feat: implement dealership backend`
3. `11c8d3f` `feat: build dealership and public interfaces`
4. `e91f699` `test: cover critical dealership workflows`
5. `ee4b4c0` `docs: document TrailerDesk reference architecture`
6. `6d46389` `fix: decouple email config from generated env literals`
7. `5f66650` `fix: preserve seed worker startup failures`
8. `3c081bc` `ci: separate trusted browser verification`
9. `8052b7f` `docs: record Phase 2 verification`

GitHub reports the repository as public with `main` as its default branch. The local
checkout tracks `origin/main` and was clean at the recorded application commit.

## CI evidence

[GitHub Actions run 40352523670](https://github.com/s-patompong/trailerdesk/actions/runs/40352523670),
attempt 2, passed for exact commit
`3c081bce7f9d8e6683ea90d1e536b56bec191dd4` on 2026-10-26.

- `check` passed dependency installation, full-history and staged-tree secret scans,
  Postgres startup and migrations, `pnpm check`, and the production SSR build.
- `browser` passed migration, real remote Workers AI seeding and the complete Chromium
  suite: 26 tests passed in 3.9 minutes.
- The Cloudflare CI token is stored only as the `CLOUDFLARE_API_TOKEN` Actions secret.
  Its account ID is a repository variable. Neither value is committed.
- Failed browser evidence is retained for seven days. The successful run produced no
  failure artifact.

The first CI executions found two clean-run defects that local state had hidden. Generated
Wrangler types were narrower before `.dev.vars` existed, and seed cleanup masked an exited
development server. Commits `6d46389` and `5f66650` fixed those causes rather than weakening
the checks. The preserved seed output then showed that Wrangler edge preview additionally
needed `Workers Scripts: Edit`; the token was narrowed to that permission plus Workers AI
read/edit.

## Pull-request security

Pull requests, including Dependabot and forks, run the complete fast, secret-free `check`
job. The credentialed browser suite is a separate manual workflow. GitHub does not provide
Actions secrets to Dependabot or fork pull requests, and neither workflow uses
`pull_request_target` to execute untrusted code with secrets.

This is an intentional speed and security boundary, not equivalent automatic browser
coverage. Reviewers rely on the fast PR gate and run relevant Playwright files locally or
manually dispatch the full trusted suite when a changed flow warrants it.

The fast gate runs 18 Worker/service tests and a React component test for accessible,
plain-language frontend validation. `REVIEW.md`, the pull-request template and CODEOWNERS
define evidence-backed findings, risk-scaled human attention, exact-commit approval and a
maximum of three review rounds. A solo maintainer cannot honestly supply the documented
two-person high-risk review, so the policy requires recording that limitation, explicit
owner sign-off, stronger focused verification and a concrete rollback instead.

GitHub branch protection enforces pull requests, the up-to-date `check` status, resolved
review conversations and linear history on `main`, including for administrators. Force
pushes and branch deletion are disabled. Required approvals are set to zero to avoid a
solo-owner deadlock; CODEOWNERS requests review, while risk-scaled human approvals remain
documented policy until another maintainer with write access is available.

## Simplifications and remaining work

- GitHub Actions uses the repository secret directly; protected deployment environments
  and environment approvals remain Phase 3 work.
- Browser installation follows Playwright's official `install --with-deps chromium`
  command. GitHub-hosted download time varied from 21 seconds to about 11 minutes. That
  variability is why the full suite is manual rather than a required CI gate.
- The open Dependabot update is not merged automatically. Its code still requires review.
- There is no deploy workflow yet. Phase 3 calls for a manual production deployment first,
  live verification, and only then a manually triggered CI deploy job.
- Hosted Postgres, Hyperdrive, KV, R2, queues, Turnstile, Resend, Google OAuth and production
  secrets are deliberately absent until the user approves Phase 3 resource creation.

Phase 2 stops here. Read the [deployment guide](guides/deployment.md) before starting the
next phase.
