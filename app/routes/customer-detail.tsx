import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { getCustomer } from "../../server/features/customers/customers.service";
import { throwHttpError } from "../../server/platform/errors";
import { formatMoney } from "../../server/platform/money";
import { authInfo } from "../../server/platform/session";
import { NoteForm } from "../components/forms/note-form";
import { StaffShell } from "../components/layout/staff-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/customer-detail";

export async function loader({ request, params }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  try {
    return { ...info, ...(await getCustomer(request, env, params.id)) };
  } catch (error) {
    return throwHttpError(error);
  }
}
export default function CustomerDetail({
  loaderData: d,
}: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <Link to="/customers" className="text-sm text-primary">
        Back to customers
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">{d.customer.name}</h1>
      <p className="mt-2 text-muted-foreground">
        {d.customer.email} · {d.customer.phone || "No phone added"}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomerHistory history={d.history} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <NoteForm endpoint={`/api/customers/${d.customer.id}/notes`} />
            {d.history.notes.map((note) => (
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

function CustomerHistory({
  history,
}: {
  history: Route.ComponentProps["loaderData"]["history"];
}) {
  return (
    <>
      {history.leads.map((lead) => (
        <p key={lead.id}>
          <Link className="text-primary underline" to={`/leads/${lead.id}`}>
            Inquiry: {lead.stage}
          </Link>
          <span className="mt-1 block text-sm text-muted-foreground">
            {lead.message}
          </span>
        </p>
      ))}
      {history.quotes.map((quote) => (
        <p key={quote.id}>
          <Link to={`/quotes/${quote.id}`} className="text-primary underline">
            Quote: {formatMoney(quote.totalCents)}
          </Link>
        </p>
      ))}
      {history.deals.map((deal) => (
        <p key={deal.id}>
          <Link to={`/deals/${deal.id}`} className="text-primary underline">
            Purchase: {formatMoney(deal.totalCents)}
          </Link>
        </p>
      ))}
      {!history.leads.length &&
        !history.quotes.length &&
        !history.deals.length && (
          <p className="text-muted-foreground">
            No inquiries, quotes or purchases yet.
          </p>
        )}
    </>
  );
}
