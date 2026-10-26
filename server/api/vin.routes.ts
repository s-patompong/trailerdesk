import { Hono } from "hono";

import { draftDescription, lookupVin } from "../features/inventory/vin.service";

export const vinRoutes = new Hono<{ Bindings: Env }>()
  .get("/:vin", async (context) =>
    context.json(
      await lookupVin(context.req.raw, context.env, context.req.param("vin")),
    ),
  )
  .post("/description", async (context) =>
    context.json(
      await draftDescription(
        context.req.raw,
        context.env,
        await context.req.json<unknown>(),
      ),
    ),
  );
