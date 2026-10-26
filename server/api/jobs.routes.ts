import { Hono } from "hono";

import { getFailedJobs, retryFailedJob } from "../features/jobs/jobs.service";

export const jobRoutes = new Hono<{ Bindings: Env }>()
  .get("/", async (context) =>
    context.json(await getFailedJobs(context.req.raw, context.env)),
  )
  .post("/:id/retry", async (context) =>
    context.json(
      await retryFailedJob(
        context.req.raw,
        context.env,
        context.req.param("id"),
      ),
    ),
  );
