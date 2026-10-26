import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { getLead } from "../../server/features/leads/leads.service";
import { throwHttpError } from "../../server/platform/errors";
import { authInfo } from "../../server/platform/session";
import { NoteForm } from "../components/forms/note-form";
import { StaffShell } from "../components/layout/staff-shell";
import { LeadControls } from "../components/leads/lead-controls";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/lead-detail";

export async function loader({ request, params }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  try {
    return { ...info, ...(await getLead(request, env, params.id)) };
  } catch (error) {
    return throwHttpError(error);
  }
}
export default function LeadDetail({ loaderData: d }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <Link to="/leads" className="text-sm text-primary">
        Back to leads
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">{d.customer.name}</h1>
      <p className="mt-2 text-muted-foreground">
        {d.customer.email} · {d.customer.phone}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm whitespace-pre-wrap">
              {d.lead.message || "No message added."}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-primary">
              <Link to={`/customers/${d.customer.id}`}>Customer history</Link>
              {d.lead.trailerId && (
                <>
                  <Link to={`/inventory/${d.lead.trailerId}`}>
                    View trailer
                  </Link>
                  <Link
                    to={`/quotes/new?trailerId=${d.lead.trailerId}&customerId=${d.customer.id}`}
                  >
                    Build a quote
                  </Link>
                </>
              )}
            </div>
            <LeadControls
              id={d.lead.id}
              stage={d.lead.stage}
              assignedTo={d.lead.assignedTo}
              staff={d.staff}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <NoteForm endpoint={`/api/leads/${d.lead.id}/notes`} />
            {d.notes.map((note) => (
              <p
                key={note.id}
                className="border-t pt-4 text-sm whitespace-pre-wrap"
              >
                {note.body}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </StaffShell>
  );
}
