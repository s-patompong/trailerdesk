import { eq } from "drizzle-orm";

import { trailers } from "../../platform/schema/inventory";
import { chunks, documents } from "../../platform/schema/search";
import { tenantWhere } from "../../platform/tenant";

import type { StaffContext } from "../../platform/context";

export async function readSource(
  context: StaffContext,
  type: "trailer" | "document",
  id: string,
  lock = false,
) {
  if (type === "document") {
    const query = context.db
      .select()
      .from(documents)
      .where(
        tenantWhere(
          documents.dealershipId,
          context.dealershipId,
          eq(documents.id, id),
        ),
      )
      .limit(1);
    const rows = await (lock ? query.for("update") : query);
    const doc = rows[0];
    return doc
      ? {
          title: doc.title,
          content: "",
          key: doc.key,
          version: `${doc.contentHash}:${String(doc.public)}`,
          public: doc.public,
        }
      : undefined;
  }
  const query = context.db
    .select({
      year: trailers.year,
      make: trailers.make,
      model: trailers.model,
      type: trailers.type,
      size: trailers.size,
      gvwr: trailers.gvwr,
      hitchType: trailers.hitchType,
      doorType: trailers.doorType,
      description: trailers.description,
    })
    .from(trailers)
    .where(
      tenantWhere(
        trailers.dealershipId,
        context.dealershipId,
        eq(trailers.id, id),
      ),
    )
    .limit(1);
  const rows = await (lock ? query.for("update") : query);
  const trailer = rows[0];
  return trailer
    ? {
        title: `${String(trailer.year)} ${trailer.make} ${trailer.model}`,
        content: `${trailer.type} ${trailer.size}, ${String(trailer.gvwr)} lb GVWR, ${trailer.hitchType}, ${trailer.doorType} door.\n${trailer.description}`,
        key: null,
        version: "",
        public: true,
      }
    : undefined;
}
export async function indexedVersion(
  context: StaffContext,
  type: string,
  id: string,
) {
  const rows = await context.db
    .select({ version: chunks.sourceVersion })
    .from(chunks)
    .where(
      tenantWhere(
        chunks.dealershipId,
        context.dealershipId,
        eq(chunks.sourceType, type),
        eq(chunks.sourceId, id),
      ),
    )
    .limit(1);
  return rows[0]?.version;
}
export async function replaceChunks(
  context: StaffContext,
  source: {
    sourceType: string;
    sourceId: string;
    version: string;
    title: string;
    public: boolean;
  },
  texts: string[],
  embeddings: number[][],
) {
  await context.db
    .delete(chunks)
    .where(
      tenantWhere(
        chunks.dealershipId,
        context.dealershipId,
        eq(chunks.sourceType, source.sourceType),
        eq(chunks.sourceId, source.sourceId),
      ),
    );
  await context.db.insert(chunks).values(
    texts.map((content, position) => {
      const embedding = embeddings[position];
      if (!embedding) throw new Error("An embedding is missing.");
      return {
        id: crypto.randomUUID(),
        dealershipId: context.dealershipId,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        sourceVersion: source.version,
        title: source.title,
        content,
        public: source.public,
        position,
        embedding,
      };
    }),
  );
  if (source.sourceType === "document")
    await context.db
      .update(documents)
      .set({ status: "ready" })
      .where(
        tenantWhere(
          documents.dealershipId,
          context.dealershipId,
          eq(documents.id, source.sourceId),
        ),
      );
}
export function trailerIds(context: StaffContext) {
  return context.db
    .select({ id: trailers.id })
    .from(trailers)
    .where(tenantWhere(trailers.dealershipId, context.dealershipId));
}
export function addDocument(
  context: StaffContext,
  input: {
    id: string;
    title: string;
    public: boolean;
    key: string;
    contentHash: string;
  },
) {
  return context.db
    .insert(documents)
    .values({ ...input, dealershipId: context.dealershipId });
}
export function listDocuments(context: StaffContext) {
  return context.db
    .select({
      id: documents.id,
      title: documents.title,
      public: documents.public,
      status: documents.status,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(
      tenantWhere(
        documents.dealershipId,
        context.dealershipId,
        context.role === "sales" ? eq(documents.public, true) : undefined,
      ),
    )
    .orderBy(documents.title);
}
export async function findDocument(
  context: StaffContext,
  id: string,
  publicOnly: boolean,
) {
  const rows = await context.db
    .select()
    .from(documents)
    .where(
      tenantWhere(
        documents.dealershipId,
        context.dealershipId,
        eq(documents.id, id),
        publicOnly || context.role === "sales"
          ? eq(documents.public, true)
          : undefined,
      ),
    )
    .limit(1);
  return rows[0];
}

export function markDocumentFailed(context: StaffContext, id: string) {
  return context.db
    .update(documents)
    .set({ status: "failed" })
    .where(
      tenantWhere(
        documents.dealershipId,
        context.dealershipId,
        eq(documents.id, id),
      ),
    );
}
