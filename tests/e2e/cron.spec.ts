import { expect, test } from "@playwright/test";
import { z } from "zod";

import { signInApi } from "./helpers/auth";
import { withLocalDatabase } from "./helpers/database";
import { deliveredMail } from "./helpers/mail";
import { createTestTrailer, removeTestTrailer } from "./helpers/trailer";

import type { APIRequestContext } from "@playwright/test";

function yesterdayAt(hour: number) {
  const yesterday = new Date(Date.now() - 86400000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZoneName: "longOffset",
  }).formatToParts(yesterday);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const offset = Number(value("timeZoneName").replace("GMT", "").split(":")[0]);
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    timestamp: Date.UTC(
      Number(value("year")),
      Number(value("month")) - 1,
      Number(value("day")),
      hour - offset,
    ),
  };
}
async function triggerCron(request: APIRequestContext, timestamp: number) {
  const response = await request.post(
    "/cdn-cgi/local/explorer/api/local/scheduled?worker=trailerdesk",
    {
      data: { cron: "*/15 * * * *", scheduled_time: timestamp },
    },
  );
  expect(response.status(), await response.text()).toBe(200);
}
test("nightly flags and morning manager summaries run through the local scheduled handler", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://localhost:5174",
  });
  let trailerId: string | undefined;
  let leadId: string | undefined;
  try {
    await signInApi(context, "owner");
    trailerId = await createTestTrailer(context);
    const lead = await context.request.post("/api/leads", {
      data: {
        customerId: "customer-1",
        trailerId,
        assignedTo: "local-sales",
        stage: "new",
        message: "Browser cron fixture",
      },
    });
    expect(lead.status(), await lead.text()).toBe(201);
    leadId = z.object({ id: z.uuid() }).parse(await lead.json()).id;
    await withLocalDatabase(async (db) => {
      await db.query(
        "UPDATE trailers SET arrived_at=now()-interval '100 days' WHERE id=$1 AND dealership_id=$2",
        [trailerId, "ridgeline"],
      );
      await db.query(
        "UPDATE leads SET updated_at=now()-interval '20 days' WHERE id=$1 AND dealership_id=$2",
        [leadId, "ridgeline"],
      );
    });
    await triggerCron(context.request, yesterdayAt(2).timestamp);
    await withLocalDatabase(async (db) => {
      expect(
        (
          await db.query<{ aging_band: number }>(
            "SELECT aging_band FROM trailers WHERE id=$1 AND dealership_id=$2",
            [trailerId, "ridgeline"],
          )
        ).rows[0]?.aging_band,
      ).toBe(90);
      expect(
        (
          await db.query<{ stale: boolean }>(
            "SELECT stale FROM leads WHERE id=$1 AND dealership_id=$2",
            [leadId, "ridgeline"],
          )
        ).rows[0]?.stale,
      ).toBe(true);
    });
    const morning = yesterdayAt(8);
    await triggerCron(context.request, morning.timestamp);
    await triggerCron(context.request, morning.timestamp);
    const messages = await deliveredMail(
      `daily-summary:ridgeline:${morning.date}:`,
    );
    expect(messages).toHaveLength(2);
    expect(
      messages.flatMap((message) => message.To.map((to) => to.Address)).sort(),
    ).toEqual(["manager@trailerdesk.test", "owner@trailerdesk.test"]);
    expect(messages[0]?.Text).toContain("Holds expiring today:");
  } finally {
    await context.close();
    if (leadId)
      await withLocalDatabase(async (db) => {
        await db.query("DELETE FROM leads WHERE id=$1 AND dealership_id=$2", [
          leadId,
          "ridgeline",
        ]);
      });
    if (trailerId) await removeTestTrailer(trailerId);
  }
});
