import { expect, test } from "@playwright/test";

import { signInApi } from "./helpers/auth";

test("VIN lookup prefills actual vPIC details and AI creates an editable draft without saving", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const context = await browser.newContext({
    baseURL: "http://localhost:5174",
  });
  try {
    await signInApi(context, "owner");
    const page = await context.newPage();
    await page.goto("/inventory/trailer-4/edit");
    await page.getByLabel("VIN", { exact: true }).fill("16V1U1110T1999999");
    await page.getByLabel("Make", { exact: true }).fill("");
    await page.getByRole("button", { name: "Look up VIN" }).click();
    await expect(page.getByLabel("Make", { exact: true })).not.toHaveValue("", {
      timeout: 25000,
    });
    await expect(page.getByLabel("Year", { exact: true })).toHaveValue("2026");
    await page.getByLabel("Listing description").fill("");
    await page
      .getByRole("button", { name: "Write listing description" })
      .click();
    await expect(
      page.getByText("Draft ready. Review it before saving."),
    ).toBeVisible({ timeout: 60000 });
    const draft = page.getByLabel("Listing description");
    expect((await draft.inputValue()).length).toBeGreaterThan(40);
    await draft.fill("Staff can edit this draft before publishing.");
    await expect(draft).toHaveValue(
      "Staff can edit this draft before publishing.",
    );
    await expect(page).toHaveURL(/\/inventory\/trailer-4\/edit$/);
  } finally {
    await context.close();
  }
});
