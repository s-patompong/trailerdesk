import { Hono } from "hono";

import {
  getSettings,
  saveSettings,
  uploadLogo,
} from "../features/settings/settings.service";
import { DomainError } from "../platform/errors";

export const settingsRoutes = new Hono<{ Bindings: Env }>()
  .get("/", async (c) => c.json(await getSettings(c.req.raw, c.env)))
  .patch("/", async (c) =>
    c.json(await saveSettings(c.req.raw, c.env, await c.req.json<unknown>())),
  )
  .post("/logo", async (c) => {
    const file = (await c.req.formData()).get("file");
    if (!(file instanceof File))
      throw new DomainError("invalid", "Choose a logo image.");
    return c.json(await uploadLogo(c.req.raw, c.env, file));
  });
