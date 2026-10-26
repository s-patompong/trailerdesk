import { expect } from "@playwright/test";

import { withLocalDatabase } from "./database";

import type { BrowserContext } from "@playwright/test";

export async function signInApi(
  context: BrowserContext,
  role: "owner" | "manager" | "sales",
): Promise<void> {
  await expect
    .poll(
      async () => {
        const login = await context.request.post("/api/auth/sign-in/email", {
          headers: { Origin: "http://app.localhost:5174" },
          data: {
            email: `${role}@trailerdesk.test`,
            password: "TrailerDesk-Local-2026!",
          },
        });
        if (login.status() !== 429)
          expect(login.status(), await login.text()).toBe(200);
        return login.status();
      },
      { timeout: 35000, intervals: [11000] },
    )
    .toBe(200);
  const active = await context.request.post(
    "/api/auth/organization/set-active",
    {
      headers: { Origin: "http://app.localhost:5174" },
      data: { organizationId: "ridgeline" },
    },
  );
  expect(active.status()).toBe(200);
}

// Tests share one loopback IP. Wait for capacity without clearing security state.
export async function waitForSignInCapacity(): Promise<void> {
  await expect
    .poll(
      async () =>
        withLocalDatabase(async (client) => {
          const result = await client.query<{
            count: number;
            last_request: string;
          }>(
            "SELECT count, last_request FROM auth_rate_limit WHERE key LIKE $1",
            ["%sign-in/email%"],
          );
          return result.rows.every(
            (row) =>
              row.count < 3 || Date.now() - Number(row.last_request) >= 11000,
          );
        }),
      { timeout: 20000, intervals: [1000] },
    )
    .toBe(true);
}
