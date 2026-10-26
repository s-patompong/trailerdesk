import { Hono } from "hono";

import {
  getDocuments,
  readDocument,
  reindexInventory,
  uploadDocument,
} from "../features/search/indexing.service";
import { askShopper, askStaff } from "../features/search/search.service";
import { DomainError } from "../platform/errors";

export const documentRoutes = new Hono<{ Bindings: Env }>()
  .get("/", async (context) =>
    context.json(await getDocuments(context.req.raw, context.env)),
  )
  .get("/:id", (context) =>
    readDocument(context.req.raw, context.env, context.req.param("id")),
  )
  .post("/reindex-inventory", async (context) =>
    context.json(await reindexInventory(context.req.raw, context.env), 202),
  )
  .post("/", async (context) => {
    const body = await context.req.formData();
    const file = body.get("file");
    if (!(file instanceof File))
      throw new DomainError("invalid", "Choose a document.");
    return context.json(
      await uploadDocument(
        context.req.raw,
        context.env,
        { title: body.get("title"), public: body.get("public") === "true" },
        file,
      ),
      202,
    );
  });
export const assistantRoutes = new Hono<{ Bindings: Env }>()
  .post("/staff", async (context) =>
    context.json(
      await askStaff(
        context.req.raw,
        context.env,
        await context.req.json<unknown>(),
      ),
    ),
  )
  .post("/shopper/:slug", async (context) =>
    context.json(
      await askShopper(
        context.req.raw,
        context.env,
        context.req.param("slug"),
        await context.req.json<unknown>(),
      ),
    ),
  );
