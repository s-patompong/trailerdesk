import { z } from "zod";

import { runDailyJobs } from "../features/dashboard/dashboard.service";
import { validateEnv } from "../platform/env";

export async function scheduled(
  controller: ScheduledController,
  env: Env,
): Promise<void> {
  validateEnv(env);
  const timestamp = z.number().int().positive().parse(controller.scheduledTime);
  await runDailyJobs(env, new Date(timestamp));
}
