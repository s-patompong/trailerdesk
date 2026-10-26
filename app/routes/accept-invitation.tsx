import { env } from "cloudflare:workers";
import { Link } from "react-router";

import { authInfo, pendingInvitations } from "../../server/platform/session";
import { AcceptInvite } from "../components/auth/accept-invite";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/accept-invitation";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  return {
    ...info,
    id: new URL(request.url).searchParams.get("id") ?? "",
    invitations: info.user ? await pendingInvitations(request, env) : [],
  };
}
export default function AcceptInvitation({
  loaderData: d,
}: Route.ComponentProps) {
  const pending = d.invitations.filter(
    (invite) =>
      invite.status === "pending" && new Date(invite.expiresAt) > new Date(),
  );
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 px-5 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Your dealership invitation</CardTitle>
          <CardDescription>
            {d.user
              ? "Choose an invitation to join your team."
              : "Sign in or create your staff account using the invited email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {d.user ? (
            <>
              {pending.map((invite) => (
                <div key={invite.id} className="space-y-3 border-t pt-4">
                  <p className="font-medium">{invite.organizationName}</p>
                  <p className="text-sm text-muted-foreground">
                    Role: {invite.role}
                  </p>
                  <AcceptInvite
                    id={invite.id}
                    organizationId={invite.organizationId}
                  />
                </div>
              ))}
              {!pending.length && (
                <p className="text-sm text-muted-foreground">
                  No pending invitations were found for this email. Verify your
                  email, or ask your dealership to send a new invitation.
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/join?id=${encodeURIComponent(d.id)}`}>
                  Create staff account
                </Link>
              </Button>
            </div>
          )}
          {d.activeOrganizationId && (
            <Link className="text-sm text-primary" to="/inventory">
              Open your dealership
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
