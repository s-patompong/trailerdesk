import { expect, test } from "@playwright/test";

import { signInApi } from "./helpers/auth";
import { createTestTrailer, removeTestTrailer } from "./helpers/trailer";

test("quote form validates cents, adds an option and shows the completed sale and bill", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  let trailerId: string | undefined;
  try {
    await signInApi(context, "owner");
    trailerId = await createTestTrailer(context);
    const page = await context.newPage();
    await page.goto(`/quotes/new?trailerId=${trailerId}&customerId=customer-1`);
    await page.getByLabel("Document fee ($)").fill("12.345");
    await page.getByLabel("Document fee ($)").blur();
    await expect(
      page.getByText("Enter dollars and cents, such as 8499.00."),
    ).toBeVisible();
    await page.getByLabel("Document fee ($)").fill("150.00");
    await page
      .getByRole("button", { name: "Add an option", exact: true })
      .click();
    await page.getByLabel("Add-on 1", { exact: true }).fill("Spare tire");
    await page.getByLabel("Add-on 1 price ($)").fill("180.00");
    await page.getByLabel("Delivery fee ($)").fill("0.00");
    await page.getByLabel("Sales tax rate (%)").fill("6.25");
    await expect(
      page.getByText("Total $5,130.81, including $301.81 sales tax."),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Create quote", exact: true })
      .click();
    await expect(page).toHaveURL(/\/quotes\/[a-f0-9-]{36}$/);
    const quoteId = new URL(page.url()).pathname.split("/").pop();
    await expect(page.getByText("Spare tire", { exact: true })).toBeVisible();
    const pdfUrl = await page
      .getByRole("link", { name: "Open quote PDF" })
      .getAttribute("href");
    if (!pdfUrl) throw new Error("The saved quote has no PDF link.");
    const pdf = await context.request.get(pdfUrl);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");
    await page
      .getByRole("button", { name: "Email quote", exact: true })
      .click();
    await expect(
      page.getByText("The quote has been emailed to the customer."),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Mark deal as sold", exact: true })
      .click();
    await expect(page).toHaveURL(/\/deals\/[a-f0-9-]{36}$/);
    await expect(page.getByText("Finished", { exact: true })).toBeVisible({
      timeout: 30000,
    });
    const billUrl = await page
      .getByRole("link", { name: "Open bill of sale" })
      .getAttribute("href");
    if (!billUrl) throw new Error("The completed sale has no bill link.");
    expect((await context.request.get(billUrl)).headers()["content-type"]).toBe(
      "application/pdf",
    );
    await page.goto("/customers/customer-1");
    await expect(
      page.locator(`a[href="/quotes/${quoteId ?? ""}"]`),
    ).toBeVisible();
  } finally {
    await context.close();
    if (trailerId) await removeTestTrailer(trailerId);
  }
});
