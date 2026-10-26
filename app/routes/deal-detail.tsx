import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { getDeal } from "../../server/features/deals/deals.service";
import { throwHttpError } from "../../server/platform/errors";
import { formatMoney } from "../../server/platform/money";
import { authInfo } from "../../server/platform/session";
import { StaffShell } from "../components/layout/staff-shell";
import { WorkflowProgress } from "../components/quotes/workflow-progress";
import { Button } from "../components/ui/button";

import type { Route } from "./+types/deal-detail";

export async function loader({ request, params }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  try {
    return { ...info, ...(await getDeal(request, env, params.id)) };
  } catch (error) {
    return throwHttpError(error);
  }
}
export default function DealDetail({ loaderData: d }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <Link to="/deals" className="text-sm text-primary">
        Back to quotes and deals
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">
        Sale to {d.quote.snapshot.customerName}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {d.quote.snapshot.trailer} · {formatMoney(d.deal.totalCents)}
      </p>
      <WorkflowProgress
        id={d.deal.id}
        progress={d.deal.progress}
        needsAttention={d.closing.needsAttention}
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to={`/quotes/${d.quote.id}`}>View quote</Link>
        </Button>
        {d.deal.billKey && (
          <Button asChild>
            <a
              target="_blank"
              rel="noreferrer"
              href={`/d/${d.quote.snapshot.slug}/bills/${d.quote.pdfToken}`}
            >
              Open bill of sale
            </a>
          </Button>
        )}
      </div>
    </StaffShell>
  );
}
