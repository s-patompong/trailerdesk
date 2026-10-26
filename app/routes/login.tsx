import { env } from "cloudflare:workers";
import { Truck } from "lucide-react";
import { data, Link, redirect } from "react-router";

import { signInSchema } from "../../server/features/auth/auth.schemas";
import { isAdminOrigin } from "../../server/platform/origins";
import {
  platformAuthInfo,
  platformSignIn,
} from "../../server/platform/platform-session";
import { authInfo, signIn } from "../../server/platform/session";
import { SignInForm } from "../components/auth/sign-in-form";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { authClient } from "../lib/auth-client";

import type { Route } from "./+types/login";

export function meta() {
  return [{ title: "Sign in | TrailerDesk" }];
}
export async function loader({ request }: Route.LoaderArgs) {
  if (isAdminOrigin(request, env)) {
    const info = await platformAuthInfo(request, env);
    if (info.user) return redirect("/admin");
    return { audience: "platform" as const, googleEnabled: false };
  }
  const info = await authInfo(request, env);
  if (info.user && info.activeOrganizationId) return redirect("/inventory");
  return { audience: "dealership" as const, googleEnabled: info.googleEnabled };
}
export async function action({ request }: Route.ActionArgs) {
  const parsed = signInSchema.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success)
    return data(
      { error: "Enter a valid email and a password with 8 to 128 characters." },
      { status: 400 },
    );
  const response = isAdminOrigin(request, env)
    ? await platformSignIn(request, env, parsed.data)
    : await signIn(request, env, parsed.data);
  if (response.ok || response.status === 302) return response;
  return data(
    {
      error:
        response.status === 429
          ? "Too many sign-in attempts. Wait a moment, then try again."
          : "Please check your email and password, and verify your email before signing in.",
    },
    {
      status: response.status === 429 ? 429 : 400,
      headers:
        response.status === 429
          ? { "Retry-After": response.headers.get("X-Retry-After") ?? "10" }
          : {},
    },
  );
}
export default function Login({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-8 px-5 py-12">
      <Link
        to="/"
        className="flex items-center justify-center gap-2 text-xl font-bold tracking-tight text-primary"
      >
        <Truck className="size-7" aria-hidden="true" />
        TrailerDesk
      </Link>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            {loaderData.audience === "platform"
              ? "Sign in to TrailerDesk administration."
              : "Sign in to your dealership."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SignInForm serverError={actionData?.error} />
          {loaderData.audience === "dealership" && loaderData.googleEnabled && (
            <>
              <Separator />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  void authClient.signIn.social({
                    provider: "google",
                    callbackURL: "/auth/complete",
                  });
                }}
              >
                Sign in with Google
              </Button>
            </>
          )}
          <Button asChild variant="link" className="w-full">
            <Link to="/reset-password">Forgot your password?</Link>
          </Button>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        {loaderData.audience === "platform"
          ? "Platform access is separate from dealership accounts."
          : "A clearer day at the dealership."}
      </p>
    </main>
  );
}
