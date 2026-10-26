import { Hono } from "hono";

import {
  browseDealership,
  readPublicPhoto,
  submitInquiry,
} from "../features/public-site/public-site.service";

export const publicRoutes = new Hono<{ Bindings: Env }>()
  .get("/:slug", async (context) => {
    context.header(
      "Cache-Control",
      "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    );
    return context.json(
      await browseDealership(
        context.env,
        context.req.param("slug"),
        context.req.query(),
      ),
    );
  })
  .get("/:slug/photos/:id", (context) =>
    readPublicPhoto(
      context.env,
      context.req.param("slug"),
      context.req.param("id"),
    ),
  )
  .post("/:slug/inquiries", async (context) =>
    context.json(
      await submitInquiry(
        context.req.raw,
        context.env,
        context.req.param("slug"),
        await context.req.json<unknown>(),
      ),
      202,
    ),
  );
