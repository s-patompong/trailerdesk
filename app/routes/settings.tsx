import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { getSettings } from "../../server/features/settings/settings.service";
import { configuration } from "../../server/platform/config";
import { throwHttpError } from "../../server/platform/errors";
import { authInfo } from "../../server/platform/session";
import { StaffShell } from "../components/layout/staff-shell";
import { LogoUpload } from "../components/settings/logo-upload";
import { ProfileForm } from "../components/settings/profile-form";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/settings";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  try {
    return {
      ...info,
      ...(await getSettings(request, env)),
      publicUrl: configuration(env).app.publicUrl,
    };
  } catch (error) {
    return throwHttpError(error);
  }
}
export default function Settings({ loaderData: d }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <h1 className="text-3xl font-semibold">Dealership settings</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/staff">Manage staff</Link>
        </Button>
        <Button asChild variant="outline">
          <a href={`${d.publicUrl}/d/${d.slug}`}>Open public site</a>
        </Button>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Dealership profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm values={{ ...d.profile, name: d.name }} />
          {d.logo && (
            <img
              src={`/api/public/${d.slug}/logo`}
              alt="Current dealership logo"
              width={96}
              height={96}
              className="mt-6 size-24 object-contain"
            />
          )}
          <LogoUpload />
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {d.audit.map((entry) => (
            <p key={entry.id} className="border-b pb-3 text-sm">
              <span className="capitalize">
                {entry.action.replaceAll(".", " ").replaceAll("_", " ")}
              </span>
              <span className="ml-3 text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString("en-US", {
                  timeZone: d.profile.timezone,
                })}
              </span>
            </p>
          ))}
        </CardContent>
      </Card>
    </StaffShell>
  );
}
