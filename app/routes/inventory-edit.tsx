import { env } from "cloudflare:workers";
import { data, redirect } from "react-router";

import { trailerFormSchema } from "../../server/features/inventory/inventory.schemas";
import {
  editInventory,
  getInventory,
} from "../../server/features/inventory/inventory.service";
import { DomainError, throwHttpError } from "../../server/platform/errors";
import {
  requirePermission,
  roleSchema,
} from "../../server/platform/permissions";
import { authInfo } from "../../server/platform/session";
import { TrailerForm } from "../components/inventory/trailer-form";
import { StaffShell } from "../components/layout/staff-shell";

import type { Route } from "./+types/inventory-edit";

export async function loader({ request, params }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  try {
    requirePermission(roleSchema.parse(info.role), "inventory.write");
    const { trailer } = await getInventory(request, env, params.id);
    if (!["in_stock", "on_order"].includes(trailer.status))
      throw new DomainError(
        "conflict",
        "Release the hold or open the deal before editing this trailer.",
      );
    if (trailer.dealerCostCents === undefined)
      throw new DomainError("forbidden", "You cannot edit dealer cost.");
    return {
      ...info,
      version: trailer.version,
      values: trailerFormSchema.parse({
        ...trailer,
        askingPriceCents: (trailer.askingPriceCents / 100).toFixed(2),
        dealerCostCents: (trailer.dealerCostCents / 100).toFixed(2),
      }),
      prices: {
        askingPriceCents: (trailer.askingPriceCents / 100).toFixed(2),
        dealerCostCents: (trailer.dealerCostCents / 100).toFixed(2),
      },
    };
  } catch (error) {
    return throwHttpError(error);
  }
}
export async function action({ request, params }: Route.ActionArgs) {
  const body = Object.fromEntries(await request.formData());
  const parsed = trailerFormSchema.safeParse(body);
  if (!parsed.success)
    return data(
      { error: "Please check the trailer details and try again." },
      { status: 400 },
    );
  try {
    await editInventory(request, env, params.id, {
      ...parsed.data,
      version: Number(body.version),
    });
    return redirect(`/inventory/${params.id}`);
  } catch (error) {
    return data(
      {
        error:
          error instanceof DomainError
            ? error.message
            : "The trailer could not be saved.",
      },
      { status: 400 },
    );
  }
}
export default function EditTrailer({
  loaderData: d,
  actionData,
}: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <h1 className="mb-6 text-3xl font-semibold">Edit trailer</h1>
      <TrailerForm
        year={d.values.year}
        serverError={actionData?.error}
        version={d.version}
        initialValues={{ ...d.values, ...d.prices }}
      />
    </StaffShell>
  );
}
