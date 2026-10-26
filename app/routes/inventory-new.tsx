import { env } from "cloudflare:workers";
import { data, redirect } from "react-router";

import { trailerFormSchema } from "../../server/features/inventory/inventory.schemas";
import { addInventory } from "../../server/features/inventory/inventory.service";
import { DomainError } from "../../server/platform/errors";
import { authInfo } from "../../server/platform/session";
import { TrailerForm } from "../components/inventory/trailer-form";
import { StaffShell } from "../components/layout/staff-shell";

import type { Route } from "./+types/inventory-new";

export function meta() {
  return [{ title: "Add trailer | TrailerDesk" }];
}
export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  if (info.role === "sales") return redirect("/inventory");
  return { ...info, year: new Date().getUTCFullYear() };
}
export async function action({ request }: Route.ActionArgs) {
  const parsed = trailerFormSchema.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success)
    return data(
      { error: "Please check the highlighted trailer details and try again." },
      { status: 400 },
    );
  try {
    const result = await addInventory(request, env, parsed.data);
    return redirect(`/inventory/${result.id}`);
  } catch (error) {
    if (error instanceof DomainError)
      return data(
        { error: error.message },
        { status: error.code === "forbidden" ? 403 : 400 },
      );
    return data(
      {
        error:
          "That trailer could not be saved. Check that its VIN and stock number are unique, then try again.",
      },
      { status: 400 },
    );
  }
}
export default function NewTrailer({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <StaffShell
      stores={loaderData.organizations}
      activeId={loaderData.activeOrganizationId}
      role={loaderData.role}
    >
      <header className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight">Add trailer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Get your next arrival ready for the lot.
        </p>
      </header>
      <TrailerForm year={loaderData.year} serverError={actionData?.error} />
    </StaffShell>
  );
}
