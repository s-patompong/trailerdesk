import { env } from "cloudflare:workers";
import { data, Link, redirect } from "react-router";

import { listCustomers } from "../../server/features/customers/customers.service";
import {
  readTrailerHold,
  placeTrailerHold,
  manageTrailerHold,
} from "../../server/features/holds/holds.service";
import {
  getInventory,
  uploadPhoto,
} from "../../server/features/inventory/inventory.service";
import { configuration } from "../../server/platform/config";
import { DomainError, throwHttpError } from "../../server/platform/errors";
import { authInfo } from "../../server/platform/session";
import { HoldPanel } from "../components/inventory/hold-panel";
import { PhotoGallery } from "../components/inventory/photo-gallery";
import { PhotoUploadForm } from "../components/inventory/photo-upload-form";
import { StatusControl } from "../components/inventory/status-control";
import { TrailerSummary } from "../components/inventory/trailer-summary";
import { StaffShell } from "../components/layout/staff-shell";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";

import type { Route } from "./+types/inventory-detail";

export async function loader({ request, params }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  try {
    return {
      ...info,
      ...(await getInventory(request, env, params.id)),
      customers: await listCustomers(request, env, ""),
      hold: await readTrailerHold(request, env, params.id),
      holdDuration: configuration(env).features.holds.durationMs,
      fastTime: configuration(env).app.demoFastTime,
    };
  } catch (error) {
    return throwHttpError(error);
  }
}
export async function action({ request, params }: Route.ActionArgs) {
  const body = await request.formData();
  const intent = body.get("intent");
  try {
    if (intent === "hold") {
      const result = await placeTrailerHold(
        request,
        env,
        params.id,
        Object.fromEntries(body),
      );
      return data(
        {
          error: result.placed
            ? null
            : "Someone else already holds this trailer. See the current hold below.",
        },
        { status: result.placed ? 200 : 409 },
      );
    }
    if (intent === "release" || intent === "extend") {
      await manageTrailerHold(request, env, params.id, intent);
      return data({ error: null });
    }
    const file = body.get("photo");
    if (!(file instanceof File))
      return data({ error: "Choose a photo." }, { status: 400 });
    await uploadPhoto(request, env, params.id, file);
    return data({ error: null });
  } catch (error) {
    return data(
      {
        error:
          error instanceof DomainError
            ? error.message
            : "The photo could not be uploaded. Try again.",
      },
      { status: 400 },
    );
  }
}
export default function TrailerDetail({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { trailer } = loaderData;
  return (
    <StaffShell
      stores={loaderData.organizations}
      activeId={loaderData.activeOrganizationId}
      role={loaderData.role}
    >
      <Button asChild variant="link" className="mb-4 px-0">
        <Link to="/inventory">← Back to inventory</Link>
      </Button>
      <TrailerSummary trailer={trailer} />
      {actionData?.error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}
      <PhotoGallery
        id={trailer.id}
        photos={loaderData.photos}
        canManage={loaderData.role !== "sales"}
      />
      <StatusControl
        key={trailer.version}
        id={trailer.id}
        status={trailer.status}
        version={trailer.version}
      />
      <HoldPanel
        timezone={loaderData.timezone}
        durationLabel={`${String(loaderData.holdDuration / (loaderData.fastTime ? 1000 : 3600000))} ${loaderData.fastTime ? "seconds (local demo)" : "hours"}`}
        customers={loaderData.customers}
        hold={loaderData.hold}
        canManage={loaderData.role !== "sales"}
        available={trailer.status === "in_stock"}
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to={`/quotes/new?trailerId=${trailer.id}`}>Build a quote</Link>
        </Button>
        {loaderData.role !== "sales" &&
          ["in_stock", "on_order"].includes(trailer.status) && (
            <Button asChild variant="outline">
              <Link to={`/inventory/${trailer.id}/edit`}>Edit trailer</Link>
            </Button>
          )}
      </div>
      {loaderData.role !== "sales" && (
        <PhotoUploadForm serverError={actionData?.error} />
      )}
    </StaffShell>
  );
}
