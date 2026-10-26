# ADR 0008: Retrieve before generation and evaluate actual answers

Date: 2026-10-26. Status: accepted within the requested AI/configuration design.

## Context

An initial live model sometimes returned no citations for a known inventory query.
Requiring a tool call alone did not make retrieval reliable. Manual review then caught
a contradictory answer calling a $5,499 trailer over a $9,000 budget. HTTP success and
nonempty citations were insufficient tests of a useful dealership assistant.

## Decision

Load tenant/visibility-scoped hybrid references before generation. Keep readonly,
Zod-validated tools for live prices, availability, customer purchases and refined search.
Tools return both integer cents and server-formatted asking prices; input descriptions
explicitly explain cents. No evidence means a clear admission, never invented facts.

Keep model selection configurable. Use the currently supported Workers AI
`@cf/openai/gpt-oss-120b` after live checks of source access, exact inventory prices and
listing generation. Apply low reasoning effort only to that model family. GLM-specific
settings stay confined to GLM; other models use their supported defaults. Re-evaluate
capabilities, current pricing and free-plan eligibility before changing models.

Use maintained react-markdown 10.1.0 and remark-gfm 4.0.1 for complete, non-streamed
answer rendering rather than writing a Markdown parser. Map tables to shadcn components.
Skip raw HTML and disallow images/embedded content. Generated links are clickable only
when present in the server-produced authorized citation list. No raw-HTML plugin.

## Evidence and limits

Official model docs confirm function calling. Live tests check the $3,749 and $5,499
matches and an authorized inventory link, alongside private-data refusal. Manual review
confirmed four matching enclosed options with actual prices and availability. Separate
browser fixtures test table rendering and blocked untrusted links/HTML/images; these
UI fixture tests are not evidence of live model quality.

The Cloudflare adapter remains beta. Grounding and evaluations reduce failures; they
do not make model prose a financial or operational source of truth. Staff edit drafts
before saving, and shoppers can open actual listings or contact the dealership.

## Sources

- https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/agents/models/ai-sdk/
- https://github.com/remarkjs/react-markdown
- https://github.com/remarkjs/remark-gfm
