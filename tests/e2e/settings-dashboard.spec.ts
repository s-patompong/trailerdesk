import { expect, test } from "@playwright/test";

import { signInApi } from "./helpers/auth";

for (const role of ["owner", "manager", "sales"] as const) {
  test(`${role} dashboard and settings enforce management visibility`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: "http://localhost:5174",
    });
    try {
      await signInApi(context, role);
      const page = await context.newPage();
      await page.goto("/dashboard");
      await expect(
        page.getByRole("heading", { name: "A clear view of the day" }),
      ).toBeVisible();
      if (role === "sales") {
        await expect(
          page.getByText("Inventory value", { exact: true }),
        ).not.toBeVisible();
        expect(
          await (await context.request.get("/dashboard")).text(),
        ).not.toContain("inventoryValueCents");
        expect(
          (await context.request.post("/api/inventory", { data: {} })).status(),
        ).toBe(403);
      } else
        await expect(
          page.getByText("Inventory value", { exact: true }),
        ).toBeVisible();
      if (role !== "owner") {
        expect((await context.request.get("/api/settings")).status()).toBe(403);
        expect((await context.request.get("/settings")).status()).toBe(403);
        return;
      }
      await page.goto("/settings");
      const tax = page.getByLabel("Default sales tax rate (%)");
      const original = await tax.inputValue();
      await tax.fill("21.00");
      await tax.blur();
      await expect(
        page.getByText("Enter a tax rate of 20% or less."),
      ).toBeVisible();
      await tax.fill(original);
      await page
        .getByRole("button", { name: "Save dealership profile" })
        .click();
      await expect(
        page.getByText("Your dealership profile has been saved."),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
}
