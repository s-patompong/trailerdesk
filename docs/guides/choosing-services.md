# Choosing maintained services and libraries

Before suggesting a custom implementation for a critical or complex capability, look
for a maintained service or established library that already handles the hard parts.
Authentication, payments, email delivery and environment/configuration handling
deserve this evaluation early, including small infrastructure helpers. A short
formatting helper or a simple dealership business rule usually does not.

Use current primary sources: official documentation, supported-version policy,
release notes, security advisories and the upstream repository where available.
Check whether the recommended API is stable, deprecated or being replaced. For a
hosted service, also check current product updates and support information. Record
what you verified and when. If maintenance is unclear, say so and investigate further.

Compare a small number of plausible options against the actual requirements:
behavior, security, tenancy and roles, runtime compatibility, cost, operating effort,
and the ability to export or move data. Do not add a service just because it is popular,
and do not build critical infrastructure just because writing code seems easy.

Explain the recommended choice and its tradeoffs before implementation. A major
choice belongs in an ADR with source links. Custom critical code needs a specific
reason the available options do not fit, plus an explicit maintenance responsibility.
Avoid building adapters or extension systems for hypothetical future providers.

## Simplicity gate

Before adding a new layer, configuration source, provider, adapter, factory or generic
helper, answer three questions:

1. Which current requirement cannot use the existing path?
2. What is the smallest change that satisfies it now?
3. Can a future second implementation be added later without costly migration?

If the first answer is unclear, do not add the abstraction. Prefer one obvious workflow
and one source of truth. When a real second implementation arrives, extract only the
smallest stable boundary shared by both. DRY removes meaningful maintenance duplication;
it does not justify hiding simple control flow behind a speculative framework.

For example, a new project needing authentication should evaluate current offerings
such as Clerk and maintained authentication libraries against its requirements. The
example is not a standing instruction to choose Clerk. TrailerDesk's accepted stack
uses Better Auth with its organization plugin; its current integration and rationale
belong in the authentication ADR.

When this codebase is copied into a new project, retain this policy in its `AGENTS.md`
and keep `CLAUDE.md` pointing to that canonical guide. Re-evaluate the options for the
new project's needs rather than inheriting every TrailerDesk dependency automatically.

TrailerDesk uses T3 Env with Zod for runtime configuration. Feature code reads that
validated configuration instead of inventing local env parsing or default-secret
helpers. Normal local email is captured by Mailpit, staging uses Mailtrap Sandbox,
and production sends through Resend. Keep small adapters around supported APIs and
SDKs; do not implement SMTP delivery, authentication protocols or secret management.
