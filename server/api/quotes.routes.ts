import { Hono } from "hono";

import {
  createQuote,
  emailQuote,
  getQuote,
  getQuotes,
} from "../features/quotes/quotes.service";

export const quoteRoutes = new Hono<{ Bindings: Env }>()
  .get("/", async (context) =>
    context.json(await getQuotes(context.req.raw, context.env)),
  )
  .get("/:id", async (context) =>
    context.json(
      await getQuote(context.req.raw, context.env, context.req.param("id")),
    ),
  )
  .post("/", async (context) =>
    context.json(
      await createQuote(
        context.req.raw,
        context.env,
        await context.req.json<unknown>(),
      ),
      201,
    ),
  )
  .post("/:id/email", async (context) =>
    context.json(
      await emailQuote(context.req.raw, context.env, context.req.param("id")),
    ),
  );
