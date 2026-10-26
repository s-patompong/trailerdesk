import { Hono } from "hono";

import {
  createCustomer,
  getCustomer,
  listCustomers,
  saveCustomerNote,
} from "../features/customers/customers.service";

export const customerRoutes = new Hono<{ Bindings: Env }>()
  .get("/", async (context) =>
    context.json(
      await listCustomers(context.req.raw, context.env, context.req.query("q")),
    ),
  )
  .post("/", async (context) =>
    context.json(
      await createCustomer(
        context.req.raw,
        context.env,
        await context.req.json<unknown>(),
      ),
      201,
    ),
  )
  .get("/:id", async (context) =>
    context.json(
      await getCustomer(context.req.raw, context.env, context.req.param("id")),
    ),
  )
  .post("/:id/notes", async (context) =>
    context.json(
      await saveCustomerNote(
        context.req.raw,
        context.env,
        context.req.param("id"),
        await context.req.json<unknown>(),
      ),
    ),
  );
