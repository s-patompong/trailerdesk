import { expect, test } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { z } from "zod";

import { signInApi } from "./helpers/auth";
import { withLocalDatabase } from "./helpers/database";

test("a private PDF is extracted and embedded through the Queue and remains private", async ({
  browser,
  request,
}) => {
  test.setTimeout(90000);
  const owner = await browser.newContext({ baseURL: "http://localhost:5174" });
  const sales = await browser.newContext({ baseURL: "http://localhost:5174" });
  let documentId: string | undefined;
  try {
    await signInApi(owner, "owner");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf
      .addPage()
      .drawText(
        "Private delivery planning: call the manager before scheduling a heavy equipment delivery.",
        { x: 40, y: 700, size: 10, font },
      );
    const page = await owner.newPage();
    await page.goto("/documents");
    await page
      .getByLabel("Document title")
      .fill(`Browser PDF ${crypto.randomUUID()}`);
    await page.getByLabel("Who can read this?").selectOption("false");
    await page.getByLabel("PDF or Markdown, up to 10 MB").setInputFiles({
      name: "private-policy.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await pdf.save()),
    });
    const uploaded = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/documents") &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Upload document", exact: true })
      .click();
    const response = await uploaded;
    expect(response.status(), await response.text()).toBe(202);
    documentId = z.object({ id: z.uuid() }).parse(await response.json()).id;
    const id = documentId;
    await expect
      .poll(
        async () => {
          const docs = z
            .array(z.object({ id: z.string(), status: z.string() }))
            .parse(await (await owner.request.get("/api/documents")).json());
          return docs.find((doc) => doc.id === id)?.status;
        },
        { timeout: 60000, intervals: [1000] },
      )
      .toBe("ready");
    expect((await owner.request.get(`/documents/${id}`)).status()).toBe(200);
    expect((await request.get(`/d/ridgeline/documents/${id}`)).status()).toBe(
      404,
    );
    await signInApi(sales, "sales");
    expect((await sales.request.get(`/documents/${id}`)).status()).toBe(404);
    await withLocalDatabase(async (db) => {
      const rows = await db.query<{ content: string; dimensions: number }>(
        "SELECT content, vector_dims(embedding) AS dimensions FROM chunks WHERE source_type='document' AND source_id=$1 AND dealership_id=$2",
        [id, "ridgeline"],
      );
      expect(rows.rows[0]?.content).toContain("Private delivery planning");
      expect(rows.rows[0]?.dimensions).toBe(768);
    });
  } finally {
    await owner.close();
    await sales.close();
    if (documentId) await removeTestDocument(documentId);
  }
});

async function removeTestDocument(documentId: string) {
  await withLocalDatabase(async (db) => {
    await db.query("BEGIN");
    try {
      await db.query(
        "SELECT id FROM documents WHERE id=$1 AND dealership_id=$2 FOR UPDATE",
        [documentId, "ridgeline"],
      );
      await db.query(
        "DELETE FROM chunks WHERE source_type='document' AND source_id=$1 AND dealership_id=$2",
        [documentId, "ridgeline"],
      );
      await db.query("DELETE FROM documents WHERE id=$1 AND dealership_id=$2", [
        documentId,
        "ridgeline",
      ]);
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  });
}
