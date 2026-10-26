import { Hono } from "hono";

import {
  manageTrailerHold,
  placeTrailerHold,
  readTrailerHold,
} from "../features/holds/holds.service";

export const holdRoutes = new Hono<{ Bindings: Env }>()
  .get("/:id", async (context) =>
    context.json(
      await readTrailerHold(
        context.req.raw,
        context.env,
        context.req.param("id"),
      ),
    ),
  )
  .post("/:id", async (context) => {
    const result = await placeTrailerHold(
      context.req.raw,
      context.env,
      context.req.param("id"),
      await context.req.json<unknown>(),
    );
    return context.json(result, result.placed ? 201 : 409);
  })
  .post("/:id/release", async (context) =>
    context.json(
      await manageTrailerHold(
        context.req.raw,
        context.env,
        context.req.param("id"),
        "release",
      ),
    ),
  )
  .post("/:id/extend", async (context) =>
    context.json(
      await manageTrailerHold(
        context.req.raw,
        context.env,
        context.req.param("id"),
        "extend",
      ),
    ),
  );
