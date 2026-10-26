import { Hono } from "hono";

import {
  changeLead,
  createLead,
  getLead,
  listLeads,
  saveLeadNote,
} from "../features/leads/leads.service";

export const leadRoutes = new Hono<{ Bindings: Env }>()
  .get("/", async (c) =>
    c.json(await listLeads(c.req.raw, c.env, c.req.query())),
  )
  .get("/:id", async (c) =>
    c.json(await getLead(c.req.raw, c.env, c.req.param("id"))),
  )
  .post("/", async (c) =>
    c.json(
      await createLead(c.req.raw, c.env, await c.req.json<unknown>()),
      201,
    ),
  )
  .patch("/:id", async (c) =>
    c.json(
      await changeLead(
        c.req.raw,
        c.env,
        c.req.param("id"),
        await c.req.json<unknown>(),
      ),
    ),
  )
  .post("/:id/notes", async (c) =>
    c.json(
      await saveLeadNote(
        c.req.raw,
        c.env,
        c.req.param("id"),
        await c.req.json<unknown>(),
      ),
    ),
  );
