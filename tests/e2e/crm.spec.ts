import { expect, test } from "@playwright/test";
import { z } from "zod";

import { signInApi } from "./helpers/auth";
import { withLocalDatabase } from "./helpers/database";

import type { Page } from "@playwright/test";

test("Sales can add a validated customer, move a lead and save notes in the customer history", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://localhost:5174",
  });
  const name = `Browser Customer ${crypto.randomUUID()}`;
  let customerId: string | undefined;
  let leadId: string | undefined;
  try {
    await signInApi(context, "sales");
    const page = await context.newPage();
    customerId = await createCustomer(page, name);
    const created = await context.request.post("/api/leads", {
      data: {
        customerId,
        trailerId: "trailer-4",
        stage: "new",
        assignedTo: "local-sales",
        message: "Browser lead fixture",
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    leadId = z.object({ id: z.uuid() }).parse(await created.json()).id;
    await page.goto(`/leads/${leadId}`);
    await page.getByLabel("Stage", { exact: true }).selectOption("contacted");
    await page.getByRole("button", { name: "Save lead", exact: true }).click();
    const detail = z.object({ lead: z.object({ stage: z.string() }) });
    await expect
      .poll(
        async () =>
          detail.parse(
            await (
              await context.request.get(`/api/leads/${leadId ?? ""}`)
            ).json(),
          ).lead.stage,
      )
      .toBe("contacted");
    await page
      .getByLabel("Add a note")
      .fill("Customer needs a ramp door for weekend equipment delivery.");
    await page.getByRole("button", { name: "Save note", exact: true }).click();
    await expect(
      page.getByText(
        "Customer needs a ramp door for weekend equipment delivery.",
        { exact: true },
      ),
    ).toBeVisible();
    await page.goto("/leads");
    const card = page
      .getByRole("region", { name: "contacted leads" })
      .getByRole("link", { name, exact: true });
    await expect(card).toBeVisible();
    await page
      .locator('[draggable="true"]')
      .filter({ hasText: name })
      .dragTo(page.getByRole("region", { name: "quoted leads" }), {
        targetPosition: { x: 30, y: 15 },
      });
    await expect(
      page
        .getByRole("region", { name: "quoted leads" })
        .getByRole("link", { name, exact: true }),
    ).toBeVisible();
    await page.goto(`/customers/${customerId}`);
    await expect(
      page.getByRole("link", { name: "Inquiry: quoted" }),
    ).toBeVisible();
    await page.getByLabel("Add a note").fill("Prefers an afternoon call.");
    await page.getByRole("button", { name: "Save note", exact: true }).click();
    await expect(
      page.getByText("Prefers an afternoon call.", { exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
    await removeCustomerFixtures(customerId, leadId);
  }
});

test("switching dealerships changes both the inventory and authorized record access", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://localhost:5174",
  });
  try {
    await signInApi(context, "owner");
    const page = await context.newPage();
    await page.goto("/inventory");
    await page
      .getByLabel("YOUR DEALERSHIP", { exact: true })
      .selectOption("cedar");
    await expect(
      page.getByLabel("YOUR DEALERSHIP", { exact: true }),
    ).toHaveValue("cedar");
    await expect
      .poll(async () =>
        (await context.request.get("/api/inventory/trailer-1")).status(),
      )
      .toBe(404);
    expect(
      (await context.request.get("/api/inventory/trailer-41")).status(),
    ).toBe(200);
    expect((await context.request.get("/inventory/trailer-1")).status()).toBe(
      404,
    );
    await page
      .getByLabel("YOUR DEALERSHIP", { exact: true })
      .selectOption("ridgeline");
    await expect
      .poll(async () =>
        (await context.request.get("/api/inventory/trailer-1")).status(),
      )
      .toBe(200);
  } finally {
    await context.close();
  }
});

async function createCustomer(page: Page, name: string): Promise<string> {
  await page.goto("/customers");
  await page.getByLabel("Customer name").fill(name);
  await page.getByLabel("Email address").fill("invalid");
  await page.getByLabel("Email address").blur();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await page
    .getByLabel("Email address")
    .fill(`crm-${crypto.randomUUID()}@example.test`);
  await page.getByRole("button", { name: "Add customer", exact: true }).click();
  await expect(page).toHaveURL(/\/customers\/[a-f0-9-]{36}$/);
  return z.uuid().parse(new URL(page.url()).pathname.split("/").pop());
}
async function removeCustomerFixtures(
  customerId: string | undefined,
  leadId: string | undefined,
) {
  await withLocalDatabase(async (db) => {
    await db.query(
      "DELETE FROM notes WHERE dealership_id=$1 AND (customer_id=$2 OR lead_id=$3)",
      ["ridgeline", customerId ?? "", leadId ?? ""],
    );
    if (leadId)
      await db.query("DELETE FROM leads WHERE id=$1 AND dealership_id=$2", [
        leadId,
        "ridgeline",
      ]);
    if (customerId)
      await db.query("DELETE FROM customers WHERE id=$1 AND dealership_id=$2", [
        customerId,
        "ridgeline",
      ]);
  });
}
