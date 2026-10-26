import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { getDeals } from "../../server/features/deals/deals.service";
import { getQuotes } from "../../server/features/quotes/quotes.service";
import { formatMoney } from "../../server/platform/money";
import { authInfo } from "../../server/platform/session";
import { StaffShell } from "../components/layout/staff-shell";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/deals";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  const [deals, quotes] = await Promise.all([
    getDeals(request, env),
    getQuotes(request, env),
  ]);
  return { ...info, deals, quotes };
}
export default function Deals({ loaderData: d }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Quotes &amp; deals</h1>
        </div>
        <Button asChild>
          <Link to="/quotes/new">Build a quote</Link>
        </Button>
      </header>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quotes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-start justify-between gap-3 border-b pb-3"
              >
                <Link
                  to={`/quotes/${quote.id}`}
                  className="text-sm font-medium text-primary"
                >
                  {quote.snapshot.customerName}
                  <span className="mt-1 block font-normal text-muted-foreground">
                    {quote.snapshot.trailer}
                  </span>
                </Link>
                <span className="text-sm">{formatMoney(quote.totalCents)}</span>
              </div>
            ))}
            {!d.quotes.length && (
              <p className="text-sm text-muted-foreground">
                No quotes yet. Build one for a customer above.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.deals.map((deal) => (
              <div
                key={deal.id}
                className="flex justify-between gap-3 border-b pb-3"
              >
                <Link to={`/deals/${deal.id}`} className="text-sm text-primary">
                  {d.quotes.find((quote) => quote.id === deal.quoteId)?.snapshot
                    .customerName ?? "View deal"}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {deal.progress}
                  </span>
                </Link>
                <Badge variant="secondary">
                  {formatMoney(deal.totalCents)}
                </Badge>
              </div>
            ))}
            {!d.deals.length && (
              <p className="text-sm text-muted-foreground">
                No closed deals yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffShell>
  );
}
