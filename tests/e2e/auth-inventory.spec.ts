import { expect, test } from "@playwright/test";

import { waitForSignInCapacity } from "./helpers/auth";

test("login validates on blur and shows accessible field errors without submitting credentials", async ({
  page,
}) => {
  await waitForSignInCapacity();
  await page.goto("/login");
  await page.getByLabel("Email address").fill("wrong");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Password", { exact: true }).blur();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Enter at least 8 characters.")).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
for (const role of ["owner", "manager", "sales"]) {
  test(`${role} can sign in and receives only their dealership inventory`, async ({
    page,
  }) => {
    await waitForSignInCapacity();
    await page.goto("/login");
    await page.getByLabel("Email address").fill(`${role}@trailerdesk.test`);
    await page
      .getByLabel("Password", { exact: true })
      .fill("TrailerDesk-Local-2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/inventory$/);
    await expect(
      page.getByRole("heading", { name: "Inventory" }),
    ).toBeVisible();
    const response = await page.request.get("/api/inventory");
    const body: unknown = await response.json();
    expect(response.status()).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(JSON.stringify(body)).not.toContain("trailer-41");
    if (role === "sales")
      expect(JSON.stringify(body)).not.toContain("dealerCostCents");
    else expect(JSON.stringify(body)).toContain("dealerCostCents");
    expect((await page.request.get("/api/inventory/trailer-41")).status()).toBe(
      404,
    );
    if (role === "owner")
      await page.screenshot({
        path: "test-results/inventory-desktop.png",
        fullPage: false,
      });
  });
}

test("demo inventory photos load on a phone without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForSignInCapacity();
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@trailerdesk.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("TrailerDesk-Local-2026!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/inventory$/);
  const photo = page
    .getByRole("img", { name: "Illustrative utility trailer demo image" })
    .first();
  await expect(photo).toBeVisible();
  await expect(photo).toHaveJSProperty("complete", true);
  const width: number = await photo.evaluate(
    (element: HTMLImageElement) => element.naturalWidth,
  );
  expect(width).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/inventory-mobile.png",
    fullPage: false,
  });
});
