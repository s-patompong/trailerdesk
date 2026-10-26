import { expect, test } from "@playwright/test";

import { withLocalDatabase } from "./helpers/database";

test("embedded dealership form validates and creates a tenant-scoped lead", async ({
  page,
  request,
}) => {
  test.setTimeout(65000);
  const config = await request.get(
    "/api/public/forms/ridgeline-contact-form/config",
  );
  expect(config.ok()).toBe(true);
  expect(config.headers()["cache-control"]).toContain("public");
  expect(await config.json()).not.toHaveProperty("dealershipId");

  await page.goto("/embed-demo.html");
  const form = page.frameLocator(
    'iframe[title="Contact Ridgeline Trailer Co."]',
  );
  const turnstileToken = form.locator('input[name="turnstileToken"]');
  await expect(turnstileToken).toHaveValue(/.+/, { timeout: 30000 });
  await form.getByRole("button", { name: "Send to the dealership" }).click();
  await expect(form.getByText("Enter your name.")).toBeVisible();

  const email = `embed-${String(Date.now())}@example.test`;
  await form.getByLabel("Your name").fill("Taylor Embed Test");
  await form.getByLabel("Email address").fill(email);
  await form.getByLabel("Your question").fill("Do you deliver near Austin?");
  await form.getByRole("button", { name: "Send to the dealership" }).click();
  await expect(form.getByText(/received your inquiry/)).toBeVisible();

  await withLocalDatabase(async (client) => {
    await expect
      .poll(
        async () =>
          (
            await client.query<{ count: string }>(
              "SELECT count(*)::text AS count FROM leads l JOIN customers c ON c.id = l.customer_id AND c.dealership_id = l.dealership_id WHERE c.email = $1 AND l.dealership_id = $2 AND l.trailer_id IS NULL",
              [email, "ridgeline"],
            )
          ).rows[0]?.count,
        { timeout: 15000 },
      )
      .toBe("1");
  });
});
