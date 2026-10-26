import { env } from "cloudflare:workers";
import { redirect } from "react-router";

import { getStaff } from "../../server/features/settings/settings.service";
import { throwHttpError } from "../../server/platform/errors";
import { authInfo } from "../../server/platform/session";
import { StaffShell } from "../components/layout/staff-shell";
import { StaffInvite } from "../components/settings/staff-invite";
import { StaffMember } from "../components/settings/staff-member";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/staff";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  try {
    return { ...info, ...(await getStaff(request, env)) };
  } catch (error) {
    return throwHttpError(error);
  }
}
export default function Staff({ loaderData: d }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <h1 className="text-3xl font-semibold">Dealership staff</h1>
      <p className="mt-2 text-muted-foreground">
        Invite your team and choose what each person can do.
      </p>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Invite staff</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffInvite owner={d.role === "owner"} />
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current staff</CardTitle>
        </CardHeader>
        <CardContent>
          {d.members.map((person) => (
            <StaffMember
              key={`${person.id}-${person.role}`}
              person={person}
              owner={d.role === "owner"}
              currentUserId={d.user?.id ?? ""}
            />
          ))}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {d.invitations.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap justify-between gap-2 border-b pb-3 text-sm"
            >
              <span>{invite.email}</span>
              <Badge variant="secondary">
                {invite.status} · {invite.role}
              </Badge>
            </div>
          ))}
          {!d.invitations.length && (
            <p className="text-sm text-muted-foreground">
              No invitations have been sent yet.
            </p>
          )}
        </CardContent>
      </Card>
    </StaffShell>
  );
}
