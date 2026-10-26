import { expect, test } from "@playwright/test";

import { withLocalDatabase } from "./helpers/database";
import { deliveredMail } from "./helpers/mail";

test("public inquiry uses Turnstile, becomes a lead and captures two emails in Mailpit", async ({
  page,
  request,
}) => {
  test.setTimeout(65000);
  const publicResponse = await request.get("/api/public/ridgeline");
  expect(publicResponse.headers()["cache-control"]).toContain("public");
  const publicText = await publicResponse.text();
  for (const privateField of [
    "dealerCostCents",
    "lotLocation",
    "assignedTo",
    "customerId",
  ])
    expect(publicText).not.toContain(privateField);
  await page.goto("/d/ridgeline/trailer-3");
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(page.getByText("Enter your name.")).toBeVisible();
  const email = `shopper-${String(Date.now())}@example.test`;
  await page.getByLabel("Your name").fill("Jordan Inquiry Test");
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Your question (optional)")
    .fill("Is this trailer available this weekend?");
  await expect(page.locator('input[name="turnstileToken"]')).toHaveValue(/.+/, {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(
    page.getByText(/The dealership received your inquiry/),
  ).toBeVisible();
  await withLocalDatabase(async (client) => {
    await expect
      .poll(
        async () =>
          (
            await client.query<{ count: string }>(
              "SELECT count(*)::text AS count FROM leads l JOIN customers c ON c.id = l.customer_id AND c.dealership_id = l.dealership_id WHERE c.email = $1 AND l.dealership_id = $2",
              [email, "ridgeline"],
            )
          ).rows[0]?.count,
        { timeout: 15000 },
      )
      .toBe("1");
    const lead = await client.query<{ source_key: string }>(
      "SELECT l.source_key FROM leads l JOIN customers c ON c.id=l.customer_id AND c.dealership_id=l.dealership_id WHERE c.email=$1 AND l.dealership_id=$2",
      [email, "ridgeline"],
    );
    const source = lead.rows[0]?.source_key;
    if (!source) throw new Error("The inquiry lead was not created.");
    await expect
      .poll(
        async () => (await deliveredMail(`inquiry-customer:${source}`)).length,
        { timeout: 15000 },
      )
      .toBe(1);
    const confirmation = (await deliveredMail(`inquiry-customer:${source}`))[0];
    expect(
      confirmation?.To.some((recipient) => recipient.Address === email),
    ).toBe(true);
    const notification = (await deliveredMail(`inquiry-staff:${source}`))[0];
    expect(notification?.Subject).toBe("A shopper asked about a trailer");
  });
  await page.goto("/dev/mail");
  await expect(
    page.getByText("We received your trailer inquiry", { exact: true }).first(),
  ).toBeVisible();
});
