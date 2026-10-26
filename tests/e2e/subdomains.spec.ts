import { expect, test } from "@playwright/test";

test("staff and public hosts keep authentication on the staff surface", async ({
  page,
  request,
}) => {
  await page.goto("http://app.localhost:5174/d/ridgeline");
  await expect(page).toHaveURL("http://localhost:5174/d/ridgeline");
  await expect(
    page.getByRole("heading", { name: /right trailer/i }),
  ).toBeVisible();

  const response = await request.post(
    "http://localhost:5174/api/auth/sign-in/email",
    {
      data: {
        email: "owner@trailerdesk.test",
        password: "TrailerDesk-Local-2026!",
      },
      headers: { Origin: "http://localhost:5174" },
    },
  );
  expect(response.status()).toBe(421);
  expect(response.headers()["set-cookie"]).toBeUndefined();

  await page.goto("http://localhost:5174/login");
  await expect(page).toHaveURL("http://app.localhost:5174/login");
});

test("platform and dealership accounts use separate Better Auth realms", async ({
  page,
}) => {
  await page.goto("http://admin.localhost:5174");
  await expect(page).toHaveURL("http://admin.localhost:5174/login");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(page).toHaveURL("http://admin.localhost:5174/reset-password");
  await page
    .getByLabel("Email address")
    .fill("platform-admin@trailerdesk.test");
  const platformReset = page.waitForRequest((request) =>
    request.url().includes("/api/admin-auth/request-password-reset"),
  );
  await page.getByRole("button", { name: "Send reset link" }).click();
  await platformReset;
  await expect(page.getByText(/reset link is on its way/i)).toBeVisible();
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await expect(page).toHaveURL("http://admin.localhost:5174/login");
  await page
    .getByLabel("Email address")
    .fill("platform-admin@trailerdesk.test");
  await page.getByLabel("Password").fill("TrailerDesk-Local-2026!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("http://admin.localhost:5174/admin");
  await expect(page.getByText("Platform administration")).toBeVisible();

  const adminCookies = await page.context().cookies();
  expect(
    adminCookies.some(
      (cookie) =>
        cookie.name.startsWith("trailerdesk_admin") &&
        cookie.domain === "admin.localhost",
    ),
  ).toBe(true);

  await page.goto("http://app.localhost:5174/inventory");
  await expect(page).toHaveURL("http://app.localhost:5174/login");
});
