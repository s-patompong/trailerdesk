import { expect, test } from "@playwright/test";
import { z } from "zod";

import { signInApi } from "./helpers/auth";
import { withLocalDatabase } from "./helpers/database";

const idResult = z.object({ id: z.uuid() });
async function removeDocument(id: string) {
  await withLocalDatabase(async (db) => {
    await db.query(
      "DELETE FROM chunks WHERE source_type='document' AND source_id=$1 AND dealership_id=$2",
      [id, "ridgeline"],
    );
    await db.query("DELETE FROM documents WHERE id=$1 AND dealership_id=$2", [
      id,
      "ridgeline",
    ]);
  });
}
test("exhausted document jobs reach the DLQ, show needs attention and allow manager retry only", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const manager = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  const sales = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  let documentId: string | undefined;
  try {
    await signInApi(manager, "manager");
    const response = await manager.request.post("/api/documents", {
      multipart: {
        title: `Browser failed document ${crypto.randomUUID()}`,
        public: "false",
        file: {
          name: "invalid.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from(
            "This synthetic test file is deliberately not a PDF.",
          ),
        },
      },
    });
    expect(response.status(), await response.text()).toBe(202);
    documentId = idResult.parse(await response.json()).id;
    const id = documentId;
    let jobId = "";
    await expect
      .poll(
        async () =>
          withLocalDatabase(async (db) => {
            const result = await db.query<{ id: string }>(
              "SELECT id FROM failed_jobs WHERE dealership_id=$1 AND payload->>'sourceId'=$2",
              ["ridgeline", id],
            );
            jobId = result.rows[0]?.id ?? "";
            return jobId;
          }),
        { timeout: 60000, intervals: [1000] },
      )
      .not.toBe("");
    const page = await manager.newPage();
    await page.goto("/documents");
    await expect(
      page.getByText("Needs attention", { exact: true }),
    ).toBeVisible();
    await signInApi(sales, "sales");
    expect((await sales.request.get("/api/jobs")).status()).toBe(403);
    expect(
      (await sales.request.post(`/api/jobs/${jobId}/retry`)).status(),
    ).toBe(403);
    // A removed source is a successful no-op when the queued job is retried.
    await removeDocument(id);
    await page.goto("/failed-jobs");
    const card = page.locator(`[data-job-id="${jobId}"]`);
    await card.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(card.getByText("Sent for another attempt")).toBeVisible();
    expect(
      (await manager.request.post(`/api/jobs/${jobId}/retry`)).status(),
    ).toBe(409);
  } finally {
    await manager.close();
    await sales.close();
    if (documentId) {
      await removeDocument(documentId);
      await withLocalDatabase(async (db) => {
        await db.query(
          "DELETE FROM failed_jobs WHERE dealership_id=$1 AND payload->>'sourceId'=$2",
          ["ridgeline", documentId],
        );
      });
    }
  }
});
