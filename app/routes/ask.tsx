import { env } from "cloudflare:workers";
import { redirect } from "react-router";

import { authInfo } from "../../server/platform/session";
import { StaffShell } from "../components/layout/staff-shell";
import { AskPanel } from "../components/search/ask-panel";

import type { Route } from "./+types/ask";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  return info;
}
export default function Ask({ loaderData }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={loaderData.organizations}
      activeId={loaderData.activeOrganizationId}
      role={loaderData.role}
    >
      <h1 className="text-3xl font-semibold">Ask</h1>
      <p className="mt-2 text-muted-foreground">
        Answers from your dealership, with sources you can open.
      </p>
      <AskPanel />
    </StaffShell>
  );
}
