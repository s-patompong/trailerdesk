import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";

import { embedTexts } from "../../platform/ai";
import { withStaff, withSystem } from "../../platform/context";
import { DomainError } from "../../platform/errors";
import { sha256 } from "../../platform/hash";
import { requirePermission } from "../../platform/permissions";
import { withDealership } from "../../platform/tenant-catalog";

import {
  addDocument,
  findDocument,
  indexedVersion,
  listDocuments,
  markDocumentFailed,
  readSource,
  replaceChunks,
  trailerIds,
} from "./indexing.repo";
import { publicStoreEnabled } from "./retrieval.repo";
import { documentFile, documentInput, indexJob } from "./search.schemas";

import type { StaffContext } from "../../platform/context";

async function sourceVersion(
  source: NonNullable<Awaited<ReturnType<typeof readSource>>>,
) {
  return source.key ? source.version : sha256(source.content);
}
export async function queueTrailerIndex(
  context: StaffContext,
  id: string,
): Promise<void> {
  const source = await readSource(context, "trailer", id);
  if (!source) return;
  await context.env.JOBS.send(
    indexJob.parse({
      kind: "index",
      dealershipId: context.dealershipId,
      sourceType: "trailer",
      sourceId: id,
      version: await sourceVersion(source),
    }),
  );
}
function chunkText(text: string): string[] {
  const parts: string[] = [];
  for (let offset = 0; offset < text.length; offset += 1400) {
    const part = text.slice(offset, offset + 1600).trim();
    if (part) parts.push(part);
  }
  return parts;
}
async function documentText(env: Env, key: string): Promise<string> {
  const object = await env.FILES.get(key);
  if (!object) throw new Error("The document file is missing.");
  if (!key.endsWith(".pdf"))
    return z
      .string()
      .trim()
      .min(1)
      .max(160000)
      .parse(await object.text());
  const pdf = await getDocumentProxy(
    new Uint8Array(await object.arrayBuffer()),
  );
  try {
    if (pdf.numPages > 40)
      throw new Error("Split this document into files of 40 pages or fewer.");
    const extracted = await extractText(pdf, { mergePages: true });
    return z
      .string()
      .trim()
      .min(
        1,
        "This PDF has no selectable text. Upload a text PDF or Markdown file.",
      )
      .max(160000)
      .parse(extracted.text);
  } finally {
    await pdf.loadingTask.destroy();
  }
}
export function processIndexJob(env: Env, input: unknown) {
  const job = indexJob.parse(input);
  return withSystem(env, job.dealershipId, async (context) => {
    const source = await readSource(context, job.sourceType, job.sourceId);
    if (!source || (await sourceVersion(source)) !== job.version) return;
    if (
      (await indexedVersion(context, job.sourceType, job.sourceId)) ===
      job.version
    )
      return;
    const texts = chunkText(
      source.key ? await documentText(env, source.key) : source.content,
    );
    const embeddings: number[][] = [];
    for (let index = 0; index < texts.length; index += 25)
      embeddings.push(
        ...(await embedTexts(env, texts.slice(index, index + 25))),
      );
    await context.db.transaction(async (tx) => {
      const scoped = { ...context, db: tx };
      const current = await readSource(
        scoped,
        job.sourceType,
        job.sourceId,
        true,
      );
      if (!current || (await sourceVersion(current)) !== job.version) return;
      if (
        (await indexedVersion(scoped, job.sourceType, job.sourceId)) ===
        job.version
      )
        return;
      await replaceChunks(
        scoped,
        { ...job, title: current.title, public: current.public },
        texts,
        embeddings,
      );
    });
  });
}
export function uploadDocument(
  request: Request,
  env: Env,
  input: unknown,
  file: File,
) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "inventory.write");
    const metadata = documentInput.parse(input);
    documentFile.parse(file);
    if (!/\.(pdf|md|markdown|txt)$/i.test(file.name))
      throw new DomainError("invalid", "Choose a PDF or Markdown document.");
    const id = crypto.randomUUID();
    const bytes = await file.arrayBuffer();
    const contentHash = await sha256(bytes);
    const key = `${context.dealershipId}/documents/${id}.${file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "md"}`;
    await env.FILES.put(key, bytes, {
      httpMetadata: {
        contentType: key.endsWith(".pdf")
          ? "application/pdf"
          : "text/plain; charset=utf-8",
      },
    });
    await addDocument(context, { ...metadata, id, key, contentHash });
    await env.JOBS.send(
      indexJob.parse({
        kind: "index",
        dealershipId: context.dealershipId,
        sourceType: "document",
        sourceId: id,
        version: `${contentHash}:${String(metadata.public)}`,
      }),
    );
    return { id };
  });
}
export function getDocuments(request: Request, env: Env) {
  return withStaff(request, env, (context) => listDocuments(context));
}
export function readDocument(request: Request, env: Env, id: string) {
  return withStaff(request, env, async (context) => {
    const doc = await findDocument(context, id, false);
    const object = doc ? await env.FILES.get(doc.key) : null;
    if (!doc || !object)
      throw new DomainError("not_found", "That document could not be found.");
    return new Response(object.body, {
      headers: {
        "Content-Type": doc.key.endsWith(".pdf")
          ? "application/pdf"
          : "text/plain; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  });
}
export function reindexInventory(request: Request, env: Env) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "inventory.write");
    const trailers = await trailerIds(context);
    for (const trailer of trailers)
      await queueTrailerIndex(context, trailer.id);
    return { queued: trailers.length };
  });
}

export function readPublicDocument(env: Env, slug: string, id: string) {
  return withDealership(env, slug, false, async (db, dealershipId) => {
    const context: StaffContext = {
      db,
      env,
      dealershipId,
      role: "sales",
      userId: "public",
    };
    if (!(await publicStoreEnabled(context)))
      throw new DomainError(
        "not_found",
        "This dealership site is not available.",
      );
    const doc = await findDocument(context, id, true);
    const object = doc ? await env.FILES.get(doc.key) : null;
    if (!doc || !object)
      throw new DomainError("not_found", "That document could not be found.");
    return new Response(object.body, {
      headers: {
        "Content-Type": doc.key.endsWith(".pdf")
          ? "application/pdf"
          : "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}

export function markIndexFailure(env: Env, input: unknown) {
  const parsed = indexJob.safeParse(input);
  if (!parsed.success || parsed.data.sourceType !== "document") return;
  const job = parsed.data;
  return withSystem(env, job.dealershipId, (context) =>
    context.db.transaction(async (db) => {
      const scoped = { ...context, db };
      const source = await readSource(scoped, "document", job.sourceId, true);
      if (source && (await sourceVersion(source)) === job.version)
        await markDocumentFailed(scoped, job.sourceId);
    }),
  );
}
