import { expect, test } from "@playwright/test";
import { z } from "zod";

import { signInApi } from "./helpers/auth";
import { deliveredMail } from "./helpers/mail";
import { createTestTrailer, removeTestTrailer } from "./helpers/trailer";

const placedSchema = z.object({
  placed: z.literal(true),
  hold: z.object({
    id: z.string(),
    salespersonName: z.string(),
    customerName: z.string(),
  }),
});
const trailerSchema = z.object({ trailer: z.object({ status: z.string() }) });
test("simultaneous holds have one winner and the alarm releases it and emails once", async ({
  browser,
}) => {
  test.setTimeout(65000);
  const owner = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  const sales = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  try {
    await signInApi(owner, "owner");
    await signInApi(sales, "sales");
    const results = await Promise.all([
      owner.request.post("/api/holds/trailer-2", {
        data: { customerId: "customer-1" },
      }),
      sales.request.post("/api/holds/trailer-2", {
        data: { customerId: "customer-2" },
      }),
    ]);
    expect(results.map((result) => result.status()).sort()).toEqual([201, 409]);
    const winner = results.find((result) => result.status() === 201);
    if (!winner) throw new Error("No hold was placed.");
    const placed = placedSchema.parse(await winner.json());
    expect(
      (await sales.request.post("/api/holds/trailer-2/release")).status(),
    ).toBe(403);
    const page = await owner.newPage();
    await page.goto("/inventory/trailer-2");
    await expect(
      page.getByText(placed.hold.salespersonName, { exact: true }),
    ).toBeVisible();
    await expect
      .poll(
        async () =>
          trailerSchema.parse(
            await (await owner.request.get("/api/inventory/trailer-2")).json(),
          ).trailer.status,
        { timeout: 45000, intervals: [1000, 2000] },
      )
      .toBe("in_stock");
    const messages = await deliveredMail(`hold-release:${placed.hold.id}`);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.Subject).toBe("Your trailer hold has expired");
  } finally {
    await owner.close();
    await sales.close();
  }
});

test("a manager can extend and release a hold without waiting for its alarm", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  let trailerId: string | undefined;
  try {
    await signInApi(context, "manager");
    trailerId = await createTestTrailer(context);
    const placed = placedSchema
      .extend({ hold: z.object({ id: z.string(), expiresAt: z.string() }) })
      .parse(
        await (
          await context.request.post(`/api/holds/${trailerId}`, {
            data: { customerId: "customer-1" },
          })
        ).json(),
      );
    const extended = await context.request.post(
      `/api/holds/${trailerId}/extend`,
    );
    expect(extended.status(), await extended.text()).toBe(200);
    const current = z
      .object({ expiresAt: z.string() })
      .nullable()
      .parse(
        await (await context.request.get(`/api/holds/${trailerId}`)).json(),
      );
    expect(Date.parse(current?.expiresAt ?? "")).toBeGreaterThan(
      Date.parse(placed.hold.expiresAt),
    );
    expect(
      (await context.request.post(`/api/holds/${trailerId}/release`)).status(),
    ).toBe(200);
    expect(
      trailerSchema.parse(
        await (await context.request.get(`/api/inventory/${trailerId}`)).json(),
      ).trailer.status,
    ).toBe("in_stock");
  } finally {
    await context.close();
    if (trailerId) await removeTestTrailer(trailerId);
  }
});
