import { env } from "cloudflare:workers";
import { eq, inArray } from "drizzle-orm";
import { expect, it } from "vitest";

import { withDatabase } from "../../platform/db";
import { organization } from "../../platform/schema/auth";
import { chunks, documents } from "../../platform/schema/search";
import { dealershipId } from "../../platform/tenant";

import { findDocument } from "./indexing.repo";
import { hybridSearch } from "./retrieval.repo";

import type { StaffContext } from "../../platform/context";
import type { Database } from "../../platform/db";

it("hybrid retrieval checks current document visibility and tenant before ranking", async () => {
  await withDatabase(env.DB, async (db) => {
    const first = crypto.randomUUID();
    const second = crypto.randomUUID();
    const ids = Array.from({ length: 3 }, () => crypto.randomUUID());
    const embedding = Array.from({ length: 768 }, (_, index) =>
      index === 0 ? 1 : 0,
    );
    await db.insert(organization).values([
      { id: first, name: "First test dealer", slug: first },
      { id: second, name: "Second test dealer", slug: second },
    ]);
    const context: StaffContext = {
      db,
      env,
      dealershipId: dealershipId(first),
      role: "sales",
      userId: "test",
    };
    try {
      await seedSearchDocuments(db, first, second, ids, embedding);
      const publicId = ids[0];
      const privateId = ids[1];
      const foreignId = ids[2];
      if (!publicId || !privateId || !foreignId)
        throw new Error("The fixture is incomplete.");
      expect(
        (await hybridSearch(context, "sales", "sentinel", embedding)).map(
          (row) => row.sourceId,
        ),
      ).toEqual([publicId]);
      expect(
        (await hybridSearch(context, "public", "sentinel", embedding)).map(
          (row) => row.sourceId,
        ),
      ).toEqual([publicId]);
      expect(
        (
          await hybridSearch(
            { ...context, role: "owner" },
            "management",
            "sentinel",
            embedding,
          )
        )
          .map((row) => row.sourceId)
          .sort(),
      ).toEqual([publicId, privateId].sort());
      expect(await findDocument(context, privateId, false)).toBeUndefined();
      expect(await findDocument(context, foreignId, false)).toBeUndefined();
    } finally {
      await db.delete(chunks).where(inArray(chunks.sourceId, ids));
      await db.delete(documents).where(inArray(documents.id, ids));
      await db.delete(organization).where(eq(organization.id, first));
      await db.delete(organization).where(eq(organization.id, second));
    }
  });
});

async function seedSearchDocuments(
  db: Database,
  first: string,
  second: string,
  ids: string[],
  embedding: number[],
) {
  for (const [index, id] of ids.entries()) {
    await db.insert(documents).values({
      id,
      dealershipId: index === 2 ? second : first,
      title: `Sentinel policy ${String(index)}`,
      key: id,
      public: index !== 1,
      contentHash: id,
      status: "ready",
    });
    // Stale chunk visibility must not override the document's current access setting.
    await db.insert(chunks).values({
      id: crypto.randomUUID(),
      dealershipId: index === 2 ? second : first,
      sourceType: "document",
      sourceId: id,
      sourceVersion: id,
      title: "Sentinel policy",
      content: "Sentinel policy details.",
      public: true,
      position: 0,
      embedding,
    });
  }
}
