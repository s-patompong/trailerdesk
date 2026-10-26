import { Hono } from "hono";
import { createRequestHandler, type ServerBuild } from "react-router";

import { customerRoutes } from "./api/customers.routes";
import { dealRoutes } from "./api/deals.routes";
import { documentRoutes, assistantRoutes } from "./api/documents.routes";
import { holdRoutes } from "./api/holds.routes";
import { inventoryRoutes } from "./api/inventory.routes";
import { jobRoutes } from "./api/jobs.routes";
import { leadRoutes } from "./api/leads.routes";
import { publicRoutes } from "./api/public.routes";
import { quoteRoutes } from "./api/quotes.routes";
import { settingsRoutes } from "./api/settings.routes";
import { vinRoutes } from "./api/vin.routes";
import { readPhoto } from "./features/inventory/inventory.service";
import { publicLogo } from "./features/settings/settings.service";
import { queue } from "./jobs/queue";
import { scheduled } from "./jobs/scheduled";
import { handleAuth } from "./platform/context";
import { validateEnv } from "./platform/env";
import { errorResponse } from "./platform/errors";

const router = new Hono<{ Bindings: Env }>();
router.route("/api/inventory", inventoryRoutes);
router.route("/api/customers", customerRoutes);
router.route("/api/holds", holdRoutes);
router.route("/api/public", publicRoutes);
router.route("/api/leads", leadRoutes);
router.route("/api/jobs", jobRoutes);
router.route("/api/quotes", quoteRoutes);
router.route("/api/deals", dealRoutes);
router.route("/api/documents", documentRoutes);
router.route("/api/ask", assistantRoutes);
router.route("/api/settings", settingsRoutes);
router.get("/api/public/:slug/logo", (c) =>
  publicLogo(c.env, c.req.param("slug")),
);
router.route("/api/vin", vinRoutes);
router.get("/api/photos/:id", (context) =>
  readPhoto(context.req.raw, context.env, context.req.param("id")),
);
router.onError((error) => errorResponse(error));
router.on(["GET", "POST"], "/api/auth/*", (context) =>
  handleAuth(context.req.raw, context.env),
);
router.get("/api/health", (context) =>
  context.json({ status: "ok", app: "TrailerDesk" }),
);
const render = createRequestHandler(
  async () => {
    // React Router's generated virtual declaration widens optional fields to undefined.
    // Its build module is the ServerBuild consumed by this same framework version.
    return (await import("virtual:react-router/server-build")) as ServerBuild;
  },
  import.meta.env.MODE,
);

export default {
  scheduled,
  queue,
  fetch(request, env, ctx) {
    validateEnv(env);
    if (new URL(request.url).pathname.startsWith("/api/"))
      return router.fetch(request, env, ctx);
    return render(request);
  },
} satisfies ExportedHandler<Env>;

export { TrailerHold } from "./do/trailer-hold";

export { DealClosing } from "./workflows/deal-closing";
