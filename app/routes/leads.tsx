import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { leadFilters } from "../../server/features/leads/leads.schemas";
import { listLeads } from "../../server/features/leads/leads.service";
import { authInfo } from "../../server/platform/session";
import { StaffShell } from "../components/layout/staff-shell";
import { LeadBoard } from "../components/leads/lead-board";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import type { Route } from "./+types/leads";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  const parsed = leadFilters.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const filters = parsed.success ? parsed.data : leadFilters.parse({});
  return { ...info, filters, ...(await listLeads(request, env, filters)) };
}
export default function Leads({ loaderData: d }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Leads</h1>
          <p className="mt-2 text-muted-foreground">
            Keep every customer moving toward the right trailer.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant={d.filters.view === "board" ? "default" : "outline"}
          >
            <Link to="/leads?view=board">Board</Link>
          </Button>
          <Button
            asChild
            variant={d.filters.view === "list" ? "default" : "outline"}
          >
            <Link to="/leads?view=list">List</Link>
          </Button>
        </div>
      </header>
      {d.filters.view === "board" ? (
        <LeadBoard leads={d.leads} />
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Assigned salesperson</TableHead>
              <TableHead>Follow-up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {d.leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Link
                    className="font-medium text-primary"
                    to={`/leads/${lead.id}`}
                  >
                    {lead.customerName}
                  </Link>
                </TableCell>
                <TableCell className="capitalize">{lead.stage}</TableCell>
                <TableCell>
                  {d.staff.find((person) => person.id === lead.assignedTo)
                    ?.name ?? "Unassigned"}
                </TableCell>
                <TableCell>
                  {lead.stale && (
                    <Badge variant="outline">Needs a follow-up</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {!d.leads.length && (
        <p className="mt-6 text-muted-foreground">
          No leads yet. Public inquiries appear here automatically.
        </p>
      )}
    </StaffShell>
  );
}
