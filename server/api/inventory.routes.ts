import { Hono } from "hono";

import {
  chooseCoverPhoto,
  addInventory,
  editInventory,
  getInventory,
  listInventory,
  uploadPhoto,
} from "../features/inventory/inventory.service";
import { DomainError } from "../platform/errors";

export const inventoryRoutes = new Hono<{ Bindings: Env }>()
  .get("/", async (context) =>
    context.json(
      await listInventory(context.req.raw, context.env, context.req.query()),
    ),
  )
  .get("/:id", async (context) =>
    context.json(
      await getInventory(context.req.raw, context.env, context.req.param("id")),
    ),
  )
  .post("/", async (context) =>
    context.json(
      await addInventory(
        context.req.raw,
        context.env,
        await context.req.json<unknown>(),
      ),
      201,
    ),
  )
  .patch("/:id", async (context) =>
    context.json(
      await editInventory(
        context.req.raw,
        context.env,
        context.req.param("id"),
        await context.req.json<unknown>(),
      ),
    ),
  )
  .post("/:id/photos/:photoId/cover", async (context) =>
    context.json(
      await chooseCoverPhoto(
        context.req.raw,
        context.env,
        context.req.param("id"),
        context.req.param("photoId"),
      ),
    ),
  )
  .post("/:id/photos", async (context) => {
    const body = await context.req.formData();
    const file = body.get("photo");
    if (!(file instanceof File))
      throw new DomainError("invalid", "Choose a photo to upload.");
    return context.json(
      await uploadPhoto(
        context.req.raw,
        context.env,
        context.req.param("id"),
        file,
      ),
      201,
    );
  });
