import { expect, test } from "@playwright/test";
import { z } from "zod";

import { signInApi } from "./helpers/auth";
import { createTestTrailer, removeTestTrailer } from "./helpers/trailer";

const trailerResult = z.object({
  trailer: z.object({
    status: z.string(),
    version: z.number(),
    description: z.string(),
  }),
});
test("Sales can update availability while descriptions and dealer cost remain protected", async ({
  browser,
}) => {
  const manager = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  const sales = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  let id: string | undefined;
  try {
    await signInApi(manager, "manager");
    id = await createTestTrailer(manager);
    await signInApi(sales, "sales");
    const original = trailerResult.parse(
      await (await sales.request.get(`/api/inventory/${id}`)).json(),
    ).trailer;
    const page = await sales.newPage();
    await page.goto(`/inventory/${id}`);
    await page
      .getByLabel("Availability", { exact: true })
      .selectOption("on_order");
    await page
      .getByRole("button", { name: "Save availability", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          trailerResult.parse(
            await (
              await sales.request.get(`/api/inventory/${id ?? ""}`)
            ).json(),
          ).trailer.status,
      )
      .toBe("on_order");
    const saved = trailerResult.parse(
      await (await sales.request.get(`/api/inventory/${id}`)).json(),
    ).trailer;
    expect(saved.description).toBe(original.description);
    expect(
      (
        await sales.request.patch(`/api/inventory/${id}`, {
          data: { version: saved.version, dealerCostCents: 1 },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await sales.request.patch(`/api/inventory/${id}`, {
          data: { version: saved.version, description: "Unauthorized edit" },
        })
      ).status(),
    ).toBe(403);
    const changed = await manager.request.patch(`/api/inventory/${id}`, {
      data: { version: saved.version, askingPriceCents: 450000 },
    });
    expect(changed.status(), await changed.text()).toBe(200);
    const final = trailerResult.parse(
      await (await manager.request.get(`/api/inventory/${id}`)).json(),
    ).trailer;
    expect(final.status).toBe("on_order");
    expect(final.description).toBe(original.description);
  } finally {
    await manager.close();
    await sales.close();
    if (id) await removeTestTrailer(id);
  }
});
