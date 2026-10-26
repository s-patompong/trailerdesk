import { expect, test } from "@playwright/test";
import { z } from "zod";

import { signInApi, waitForSignInCapacity } from "./helpers/auth";
import { withLocalDatabase } from "./helpers/database";
import { deliveredMail } from "./helpers/mail";

import type { Page } from "@playwright/test";

const localPassword = "TrailerDesk-Local-2026!";
async function mailLink(prefix: string, email: string): Promise<string> {
  let text = "";
  await expect
    .poll(async () => {
      const message = (await deliveredMail(prefix)).find((mail) =>
        mail.To.some((to) => to.Address === email),
      );
      text = message?.Text ?? "";
      return text;
    })
    .toContain("http://app.localhost:5174/");
  const link = /https?:\/\/\S+/.exec(text)?.[0];
  if (!link) throw new Error("The captured email did not contain a link.");
  return link;
}
async function createInvitedAccount(
  page: Page,
  email: string,
  invitation: string,
) {
  await page.goto(`/join?id=${encodeURIComponent(invitation)}`);
  await page.getByRole("button", { name: "Create your staff account" }).click();
  await expect(page.getByLabel("Invited email address")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Your name").fill("Invited Browser Test");
  await page.getByLabel("Invited email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(localPassword);
  await page.getByRole("button", { name: "Create your staff account" }).click();
  await expect(
    page.getByText(/Check your email and verify your address/),
  ).toBeVisible();
  await page.goto(await mailLink("verify:", email));
  await waitForSignInCapacity();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(localPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/accept-invitation/);
  await page
    .getByRole("button", { name: "Accept invitation", exact: true })
    .click();
  await expect(page).toHaveURL(/\/inventory$/);
  expect(await (await page.request.get("/api/inventory")).text()).not.toContain(
    "dealerCostCents",
  );
  expect((await page.request.get("/api/settings")).status()).toBe(403);
}
async function resetInvitedPassword(page: Page, email: string) {
  const replacementPassword = crypto.randomUUID();
  await page.goto("/reset-password");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/If this email has an account/)).toBeVisible();
  await page.goto(await mailLink("reset:", email));
  await page
    .getByLabel("New password", { exact: true })
    .fill(replacementPassword);
  await page.getByLabel("Confirm new password").fill("mismatch");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByLabel("Confirm new password")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Confirm new password").fill(replacementPassword);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText(/Your password has been updated/)).toBeVisible();
  await waitForSignInCapacity();
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { Origin: "http://app.localhost:5174" },
    data: { email, password: replacementPassword },
  });
  expect(response.status(), await response.text()).toBe(200);
}

test("staff invitation, verified signup and password reset use actual captured email links", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const email = `invited-${crypto.randomUUID()}@example.test`;
  const owner = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  const invited = await browser.newContext({
    baseURL: "http://app.localhost:5174",
  });
  try {
    await signInApi(owner, "owner");
    const staff = await owner.newPage();
    await staff.goto("/staff");
    await staff.getByLabel("Staff email").fill(email);
    await staff
      .getByRole("button", { name: "Invite staff", exact: true })
      .click();
    await expect(
      staff.getByText("The staff invitation has been emailed."),
    ).toBeVisible();
    const invitation = await withLocalDatabase(async (db) => {
      const result = await db.query<{ id: string }>(
        "SELECT id FROM invitation WHERE email=$1 AND organization_id=$2",
        [email, "ridgeline"],
      );
      return z.string().parse(result.rows[0]?.id);
    });
    const invitationLink = await mailLink(`invite:${invitation}`, email);
    expect(new URL(invitationLink).searchParams.get("id")).toBe(invitation);
    const page = await invited.newPage();
    await createInvitedAccount(page, email, invitation);
    await resetInvitedPassword(page, email);
    await expect
      .poll(async () =>
        withLocalDatabase(
          async (db) =>
            (
              await db.query<{ count: string }>(
                "SELECT count(*)::text AS count FROM audit_log WHERE record_id=$1 AND action='user.invited'",
                [invitation],
              )
            ).rows[0]?.count,
        ),
      )
      .toBe("1");
  } finally {
    await invited.close();
    await owner.close();
    await withLocalDatabase(async (db) => {
      await db.query(
        "DELETE FROM invitation WHERE email=$1 AND organization_id=$2",
        [email, "ridgeline"],
      );
      await db.query("DELETE FROM auth_user WHERE email=$1", [email]);
    });
  }
});
