import { Hono } from "hono";

import {
  retryDealClosing,
  getDeal,
  getDeals,
  markQuoteSold,
} from "../features/deals/deals.service";

export const dealRoutes = new Hono<{ Bindings: Env }>()
  .get("/", async (context) =>
    context.json(await getDeals(context.req.raw, context.env)),
  )
  .get("/:id", async (context) =>
    context.json(
      await getDeal(context.req.raw, context.env, context.req.param("id")),
    ),
  )
  .post("/:id/retry", async (context) =>
    context.json(
      await retryDealClosing(
        context.req.raw,
        context.env,
        context.req.param("id"),
      ),
    ),
  )
  .post("/", async (context) =>
    context.json(
      await markQuoteSold(
        context.req.raw,
        context.env,
        await context.req.json<unknown>(),
      ),
      201,
    ),
  );
