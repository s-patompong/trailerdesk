import { expect, test } from "@playwright/test";

import { waitForSignInCapacity } from "./helpers/auth";
import { removeTestTrailer } from "./helpers/trailer";

test("add trailer validates prices and required details, then uploads a cover photo", async ({
  page,
}) => {
  await waitForSignInCapacity();
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@trailerdesk.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("TrailerDesk-Local-2026!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Add trailer", exact: true }).click();
  await page.getByLabel("Asking price ($)", { exact: true }).fill("12.345");
  await page.getByLabel("Dealer cost ($)", { exact: true }).fill("100");
  await expect(
    page.getByText("Enter dollars and cents, such as 8499.00."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save trailer", exact: true }).click();
  await expect(page).toHaveURL(/\/inventory\/new$/);
  await expect(page.getByLabel("Stock number")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("GVWR (lb)", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("VIN", { exact: true }).fill("16V1U1110T1999999");
  await page.getByLabel("Stock number").fill(`E2E-${String(Date.now())}`);
  await page.getByLabel("Make", { exact: true }).fill("Demo Maker");
  await page.getByLabel("Model", { exact: true }).fill("Utility Test");
  await page.getByLabel("Size", { exact: true }).fill("7x14");
  await page.getByLabel("GVWR (lb)", { exact: true }).fill("7000");
  await page.getByLabel("Color", { exact: true }).fill("Black");
  await page.getByLabel("Lot location", { exact: true }).fill("Test Row");
  await page.getByLabel("Asking price ($)", { exact: true }).fill("8499.95");
  let trailerId: string | undefined;
  try {
    await page
      .getByRole("button", { name: "Save trailer", exact: true })
      .click();
    await expect(page).toHaveURL(/\/inventory\/[a-f0-9-]{36}$/);
    trailerId = new URL(page.url()).pathname.split("/").pop();
    await expect(
      page.getByRole("heading", { name: /Demo Maker Utility Test/ }),
    ).toBeVisible();
    await expect(page.getByText("$8,499.95", { exact: true })).toBeVisible();
    await page
      .getByLabel("Photo", { exact: true })
      .setInputFiles("public/images/demo/utility.jpg");
    await page
      .getByRole("button", { name: "Upload photo", exact: true })
      .click();
    const image = page.getByRole("img", { name: /2026 Demo Maker/ });
    await expect(image).toBeVisible();
    await expect(image).toHaveJSProperty("complete", true);
    expect(
      await image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    ).toBeGreaterThan(0);
  } finally {
    if (trailerId) await removeTestTrailer(trailerId);
  }
});
