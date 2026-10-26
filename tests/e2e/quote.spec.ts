import { writeFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";
import { z } from "zod";

import { signInApi } from "./helpers/auth";
import { withLocalDatabase } from "./helpers/database";
import { deliveredMail } from "./helpers/mail";
import { createTestTrailer, removeTestTrailer } from "./helpers/trailer";

const quoteId = z.object({ id: z.uuid() });
const quoteDetails = z.object({
  pdfToken: z.uuid(),
  totalCents: z.number().int(),
  snapshot: z.object({ slug: z.string() }),
});
test("Sales can make an integer-cent quote and its PDF is stored and emailed", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://localhost:5174",
  });
  try {
    await signInApi(context, "sales");
    const response = await context.request.post("/api/quotes", {
      data: {
        trailerId: "trailer-4",
        customerId: "customer-1",
        options: [
          { name: "Spare tire", priceCents: 18000 },
          { name: "D-rings", priceCents: 8000 },
        ],
        docFeeCents: 15000,
        deliveryFeeCents: 0,
        tradeInCents: 10000,
        taxBps: 625,
      },
    });
    expect(response.status(), await response.text()).toBe(201);
    const quote = quoteId.parse(await response.json());
    const detail = await context.request.get(`/api/quotes/${quote.id}`);
    const data = quoteDetails.parse(await detail.json());
    expect(data.totalCents).toBe(484394);
    const pdf = await context.request.get(
      `/d/${data.snapshot.slug}/quotes/${data.pdfToken}`,
    );
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");
    const bytes = await pdf.body();
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    await writeFile("test-results/quote.pdf", bytes);
    expect(
      (await context.request.post(`/api/quotes/${quote.id}/email`)).status(),
    ).toBe(200);
    expect(
      (
        await context.request.get("/d/cedar-creek/quotes/" + data.pdfToken)
      ).status(),
    ).toBe(404);
  } finally {
    await context.close();
  }
});

test("mark sold runs the fast closing workflow once through all follow-up emails", async ({
  browser,
}) => {
  test.setTimeout(45000);
  const context = await browser.newContext({
    baseURL: "http://localhost:5174",
  });
  let trailerId: string | undefined;
  try {
    await signInApi(context, "owner");
    trailerId = await createTestTrailer(context);
    const created = await context.request.post("/api/quotes", {
      data: {
        trailerId,
        customerId: "customer-2",
        options: [],
        docFeeCents: 15000,
        deliveryFeeCents: 0,
        tradeInCents: 0,
        taxBps: 625,
      },
    });
    const quote = quoteId.parse(await created.json());
    const sold = await context.request.post("/api/deals", {
      data: { quoteId: quote.id },
    });
    expect(sold.status(), await sold.text()).toBe(201);
    const deal = quoteId.parse(await sold.json());
    const state = z.object({
      deal: z.object({ progress: z.string(), status: z.string() }),
    });
    await expect
      .poll(
        async () =>
          state.parse(
            await (await context.request.get(`/api/deals/${deal.id}`)).json(),
          ).deal.progress,
        { timeout: 30000, intervals: [1000] },
      )
      .toBe("Finished");
    const repeated = await context.request.post("/api/deals", {
      data: { quoteId: quote.id },
    });
    expect(quoteId.parse(await repeated.json()).id).toBe(deal.id);
    const messages = await deliveredMail(`deal:${deal.id}:`);
    expect(messages).toHaveLength(3);
    await withLocalDatabase(async (client) => {
      expect(
        (
          await client.query<{ count: string }>(
            "SELECT count(*)::text AS count FROM audit_log WHERE action = 'deal.closed' AND record_id = $1",
            [deal.id],
          )
        ).rows[0]?.count,
      ).toBe("1");
    });
  } finally {
    await context.close();
    if (trailerId) await removeTestTrailer(trailerId);
  }
});
