import { env } from "cloudflare:workers";
import { Link } from "react-router";

import { isAdminOrigin } from "../../server/platform/origins";
import { NewPassword } from "../components/auth/new-password";
import { ResetRequest } from "../components/auth/reset-request";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/reset-password";

export function loader({ request }: Route.LoaderArgs) {
  return {
    platform: isAdminOrigin(request, env),
    token: new URL(request.url).searchParams.get("token"),
  };
}
export default function ResetPassword({ loaderData }: Route.ComponentProps) {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-5 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            {loaderData.token
              ? "Choose a new password with at least 8 characters."
              : "We will email you a link to choose a new password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loaderData.token ? (
            <NewPassword
              token={loaderData.token}
              platform={loaderData.platform}
            />
          ) : (
            <ResetRequest platform={loaderData.platform} />
          )}
        </CardContent>
      </Card>
      <Link className="text-center text-sm text-primary" to="/login">
        Back to sign in
      </Link>
    </main>
  );
}
