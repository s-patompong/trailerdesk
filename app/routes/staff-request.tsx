import { env } from "cloudflare:workers";
import { Outlet, redirect } from "react-router";

import { staffPageAccess } from "../../server/platform/session";
import {
  staffIdentityContext,
  staffPageInfoContext,
} from "../lib/staff-request-context";

import type { Route } from "./+types/staff-request";

export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }) => {
    const access = await staffPageAccess(request, env);
    if (!access.info.user) return redirect("/login");
    if (!access.identity) return redirect("/accept-invitation");
    context.set(staffIdentityContext, access.identity);
    context.set(staffPageInfoContext, access.info);
  },
];

export default function StaffRequest() {
  return <Outlet />;
}
