# AI boundaries

`server/platform/ai.ts` selects Workers AI by default through current
`agents/models/ai-sdk` createAI. Anthropic is optional and requires its own key.
The old workers-ai-provider package is deprecated. See ADR 0001.

Listing drafts receive only approved trailer specifications, never dealer cost.
The staff member reviews the draft before it is saved. Failed model calls must
produce a clear error; never claim a fabricated response was generated.

Implemented retrieval pipeline: R2 document upload → queue → extraction/chunking →
Workers AI embeddings → Postgres chunks. Each chunk has a dealership and public
visibility. Hybrid full-text/vector retrieval combines ranks with reciprocal rank
fusion. Reprocessing replaces a source version atomically under a source lock and avoids duplicate chunks.

Staff tools must run tenant-scoped repository queries and apply the caller's role
projection. Sales cannot receive cost or margin through prompts, tool results,
retrieval or citations. Public chat can access only published public inventory and
approved public documents. No relevant evidence means an explicit admission and
an offer to contact staff. Treat document text as untrusted evidence, not instructions.

Each question first loads tenant/visibility-scoped hybrid references before generation.
Tool selection is not the only path to grounding. The model can refine retrieval and
query structured inventory/customer tools; current price/availability must come from
live inventory results. References and tool results contribute only real authorized
citation links. If a model cannot complete an answer, return an honest fallback with
available references; if neither retrieval nor tools found evidence, say so explicitly.
