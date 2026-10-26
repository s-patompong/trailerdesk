import { Link } from "react-router";

import { JoinForm } from "../components/auth/join-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/join";

export function loader({ request }: Route.LoaderArgs) {
  return { id: new URL(request.url).searchParams.get("id") ?? "" };
}
export default function Join({ loaderData }: Route.ComponentProps) {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-5 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Join your dealership</CardTitle>
          <CardDescription>
            Use the same email address that received your invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loaderData.id ? (
            <JoinForm invitationId={loaderData.id} />
          ) : (
            <p>
              Open the invitation email from your dealership to get started.
            </p>
          )}
        </CardContent>
      </Card>
      <Link className="text-center text-sm text-primary" to="/login">
        Already have an account? Sign in
      </Link>
    </main>
  );
}
