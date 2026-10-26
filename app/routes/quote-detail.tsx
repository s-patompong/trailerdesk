import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { getQuote } from "../../server/features/quotes/quotes.service";
import { throwHttpError } from "../../server/platform/errors";
import { formatMoney } from "../../server/platform/money";
import { authInfo } from "../../server/platform/session";
import { StaffShell } from "../components/layout/staff-shell";
import { QuoteActions } from "../components/quotes/quote-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";

import type { Route } from "./+types/quote-detail";

export async function loader({ request, params }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  try {
    return { ...info, quote: await getQuote(request, env, params.id) };
  } catch (error) {
    return throwHttpError(error);
  }
}
export default function QuoteDetail({ loaderData: d }: Route.ComponentProps) {
  const q = d.quote;
  const lines = [
    { label: q.snapshot.trailer, value: q.trailerPriceCents },
    ...q.options.map((option) => ({
      label: option.name,
      value: option.priceCents,
    })),
    { label: "Document fee", value: q.docFeeCents },
    { label: "Delivery fee", value: q.deliveryFeeCents },
    { label: "Trade-in allowance", value: -q.tradeInCents },
    { label: `Sales tax (${(q.taxBps / 100).toFixed(2)}%)`, value: q.taxCents },
  ];
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
        Quote for {q.snapshot.customerName}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {q.snapshot.trailer} · Stock #{q.snapshot.stockNumber}
      </p>
      <Card className="my-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Quote total</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line, index) => (
            <div
              key={`${String(index)}-${line.label}`}
              className="flex justify-between gap-4 text-sm"
            >
              <span>{line.label}</span>
              <span>{formatMoney(line.value)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(q.totalCents)}</span>
          </div>
        </CardContent>
      </Card>
      <QuoteActions
        id={q.id}
        pdfUrl={`/d/${q.snapshot.slug}/quotes/${q.pdfToken}`}
      />
    </StaffShell>
  );
}
