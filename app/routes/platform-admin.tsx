import { env } from "cloudflare:workers";
import { redirect } from "react-router";

import { platformAuthInfo } from "../../server/platform/platform-session";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/platform-admin";

export function meta() {
  return [{ title: "Platform administration | TrailerDesk" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const info = await platformAuthInfo(request, env);
  if (!info.user) return redirect("/login");
  return { name: info.user.name, email: info.user.email };
}

export default function PlatformAdmin({ loaderData }: Route.ComponentProps) {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl items-center px-5 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Platform administration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Signed in as {loaderData.name}.</p>
          <p className="text-sm text-muted-foreground">{loaderData.email}</p>
          <p className="text-sm text-muted-foreground">
            This deliberately small page proves that platform operators use a
            separate Better Auth realm from dealership staff. Add platform
            operations here only when the product requires them.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
