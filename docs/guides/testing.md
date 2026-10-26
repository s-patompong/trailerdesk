# Testing

`pnpm check` is the required quality gate: type generation/checking, ESLint with
zero warnings, Prettier, Knip, duplication detection, dependency boundaries and Vitest.
`pnpm build` checks the deployable SSR bundle. `pnpm test:e2e` runs Chromium.

Current verification includes permission rules, real test-Postgres isolation and
cost projections, browser login as all roles, accessible frontend validation,
mobile image loading, exact-cent inventory entry and R2 cover upload.
Remaining business flows are not verified until checked in the Phase 1 tracker.

The Workers test plugin runs tests inside workerd; `scripts/test-setup.ts` runs in
Node to migrate the separate test database. `pg` requires dependency optimization
and externalized Node built-ins with Vite 8. See Cloudflare workers-sdk issue 12984.

`pg-cloudflare` 1.4.1 emits `This socket has been closed.` on closing some completed
idle clients. The DB close helper ignores only that exact teardown event; query
errors and every other close error still fail. Vitest's unhandled-error checking
remains enabled. Remove the workaround after an upstream fix and rerun the tests.

Browser tests must isolate their own test records and clean up only IDs they create.
Never use a production URL or database. Remote AI calls are integration checks,
not mocked unit evidence; record actual model responses and failures separately.

Browser coverage also exercises real Workers AI citations/listing drafts, vPIC prefill,
Mailpit messages, hold conflicts/alarms, PDFs, closing follow-ups, invitations and reset
links, PDF indexing/privacy, cron summaries, lead drag/drop and dealership switching.
The failed-job test deliberately uploads a malformed local PDF and observes actual
Queue retries and DLQ consumption; it then retries a removed source as an idempotent no-op.

Playwright uses one worker because all local browser sessions share a loopback IP.
Setup respects Better Auth's real sign-in limit instead of disabling it or clearing
security counters. Frontend login tests wait for available capacity. Keep browser
traces and mail captures local: they can contain local session cookies and reset links.
Only fixture IDs created by the test may be deleted; captured emails and local R2
objects are retained for inspection. No shared database reset is part of the suite.

## Which test to write

Use the narrowest test that proves the behavior:

| Behavior                                                 | Test level                                                  | Example in this repository                    |
| -------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| Money, schemas or permission rules                       | Vitest, no database                                         | `server/platform/money.test.ts`               |
| Repository tenancy or projections                        | Vitest in workerd with the test Postgres                    | `server/features/inventory/inventory.test.ts` |
| API, bindings or provider adapters                       | Vitest in workerd; mock only the external HTTP boundary     | `server/platform/email.test.ts`               |
| Form validation, role-visible UI or a complete user flow | Playwright against the local Worker                         | `tests/e2e/inventory-form.spec.ts`            |
| Queue, alarm, Workflow or cron behavior                  | Playwright with bounded polling against real local bindings | `tests/e2e/public-inquiry.spec.ts`            |

Do not repeat an end-to-end scenario for every input permutation. Prove the rule
quickly at the domain or schema boundary, then keep one browser test for the user-visible
flow. Security boundaries need both: a hidden button is not evidence that the API denies
the request.

The fragments below show the important assertion pattern. Follow the linked test file
for the complete executable imports, fixture creation and cleanup; keeping that code in
one place prevents documentation examples from silently drifting away from the suite.

## Example: pure business rule

Pure tests should be small, deterministic and explicit about boundary values. Money uses
integer cents and basis points, so the test proves rounding without floating-point math:

```ts
import { describe, expect, it } from "vitest";

import { quoteTotals } from "./money";

describe("quote totals", () => {
  it("rounds sales tax half up", () => {
    expect(
      quoteTotals({
        trailerPriceCents: 110,
        options: [],
        docFeeCents: 0,
        deliveryFeeCents: 0,
        tradeInCents: 0,
        taxBps: 500,
      }).taxCents,
    ).toBe(6);
  });
});
```

The complete example is `server/platform/money.test.ts`.

## Example: tenant boundary against real Postgres

Repository tests run inside workerd and use `env.DB`, just like application code. Create
both tenants in the test, access the row through the repository, and clean up only those
exact IDs in `finally`:

```ts
const ownerContext: StaffContext = {
  db,
  env,
  dealershipId: dealershipId(firstDealershipId),
  userId: "test",
  role: "owner",
};

trailerId = await insertTrailer(ownerContext, validTrailer);
const foreignContext = {
  ...ownerContext,
  dealershipId: dealershipId(secondDealershipId),
};

expect(await findTrailer(foreignContext, trailerId)).toBeUndefined();
expect(
  await changeTrailer(foreignContext, trailerId, 1, { askingPriceCents: 1 }),
).toEqual([]);
expect((await findTrailer(ownerContext, trailerId))?.askingPriceCents).toBe(
  500000,
);
```

The complete test creates both organizations, inserts `validTrailer`, and removes only
those records in a `finally` block. Copy that setup from
`server/features/inventory/inventory.test.ts`; never replace the central tenant-scoped
repository call with hand-written SQL just to make a test easier.

## Example: frontend validation and server enforcement

Use accessible names in browser tests. First prove the shopper or staff member receives
useful validation:

```ts
await page.getByLabel("Asking price ($)", { exact: true }).fill("12.345");
await expect(
  page.getByText("Enter dollars and cents, such as 8499.00."),
).toBeVisible();

await page.getByRole("button", { name: "Save trailer", exact: true }).click();
await expect(page).toHaveURL(/\/inventory\/new$/);
await expect(page.getByLabel("Stock number")).toHaveAttribute(
  "aria-invalid",
  "true",
);
```

This proves the client-side experience. Then bypass the UI and prove the server rejects
forbidden data too. `tests/e2e/inventory-form.spec.ts` is the complete form example;
`tests/e2e/status-permissions.spec.ts` sends a direct `PATCH` containing dealer cost as
Sales and expects `403`.

## Example: asynchronous work without sleeps

Queues, alarms and Workflows finish asynchronously. Assert the user-visible response,
then poll a durable outcome with a timeout. Do not add a fixed `waitForTimeout`:

```ts
await page.getByRole("button", { name: "Send inquiry" }).click();
await expect(page.getByText(/received your inquiry/i)).toBeVisible();

await expect
  .poll(async () => countLeadsForEmail(email), { timeout: 15_000 })
  .toBe(1);

await expect
  .poll(
    async () => (await deliveredMail(`inquiry-customer:${sourceKey}`)).length,
    {
      timeout: 15_000,
    },
  )
  .toBe(1);
```

See `tests/e2e/public-inquiry.spec.ts` for Queue plus Mailpit and
`tests/e2e/holds.spec.ts` for concurrent requests plus a Durable Object alarm.

## Running one example

```bash
pnpm test server/platform/money.test.ts
pnpm test server/features/inventory/inventory.test.ts
pnpm test:e2e tests/e2e/status-permissions.spec.ts
pnpm test:e2e tests/e2e/public-inquiry.spec.ts
```

Run `pnpm check`, `pnpm build` and the relevant browser suite before calling a change
done. A passing lower-level test does not replace browser verification for a changed
user flow.
