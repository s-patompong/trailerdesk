import { configuration } from "../../platform/config";
import { withCachedStaff, withSystem } from "../../platform/context";
import { emailSender } from "../../platform/email";
import { dealershipIds } from "../../platform/tenant-catalog";

import {
  dailySummary,
  dashboardNumbers,
  flagAgingAndStale,
  overdueHolds,
  storeTimezone,
  summaryRecipients,
} from "./dashboard.repo";

export function getDashboard(request: Request, env: Env) {
  return withCachedStaff(request, env, (context) => dashboardNumbers(context));
}
export async function runDailyJobs(env: Env, now: Date): Promise<void> {
  const config = configuration(env).features.jobs;
  for (const { id } of await dealershipIds(env)) {
    await withSystem(env, id, async (context) => {
      for (const hold of await overdueHolds(context, now))
        await env.TRAILER_HOLD.getByName(`${id}:${hold.trailerId}`).release({
          dealershipId: id,
          trailerId: hold.trailerId,
          holdId: hold.id,
          reason: "expired",
        });
      const timezone = await storeTimezone(context);
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(now);
      const part = (type: string) =>
        parts.find((item) => item.type === type)?.value ?? "";
      if (Number(part("hour")) === config.nightlyHour)
        await flagAgingAndStale(
          context,
          config.staleLeadDays,
          config.agingDays,
        );
      if (Number(part("hour")) !== config.summaryHour) return;
      const date = `${part("year")}-${part("month")}-${part("day")}`;
      const summary = await dailySummary(context, date, timezone);
      for (const recipient of await summaryRecipients(context)) {
        await emailSender(env, context.db).send({
          dealershipId: id,
          recipient: recipient.email,
          subject: `Your dealership morning summary - ${date}`,
          body: `Good morning ${recipient.name},\n\nNew leads yesterday: ${String(summary.newLeads)}\nHolds expiring today: ${String(summary.expiring)}\nDeals closed yesterday: ${String(summary.closed)}\nTrailers on the lot ${String(config.agingDays[0])}+ days: ${String(summary.aging)}\n\nOpen TrailerDesk to follow up.`,
          idempotencyKey: `daily-summary:${id}:${date}:${recipient.email}`,
        });
      }
    });
  }
}
