import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { listCustomers } from "../../server/features/customers/customers.service";
import { listInventory } from "../../server/features/inventory/inventory.service";
import { getQuoteSettings } from "../../server/features/quotes/quotes.service";
import { authInfo } from "../../server/platform/session";
import { StaffShell } from "../components/layout/staff-shell";
import { QuoteBuilder } from "../components/quotes/quote-form";

import type { Route } from "./+types/quote-new";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  const [customers, trailers, settings] = await Promise.all([
    listCustomers(request, env, ""),
    listInventory(request, env, {}),
    getQuoteSettings(request, env),
  ]);
  if (!settings) throw new Error("The dealership profile is missing.");
  const query = new URL(request.url).searchParams;
  return {
    ...info,
    customers,
    trailers,
    defaults: settings,
    trailerId: query.get("trailerId") ?? "",
    customerId: query.get("customerId") ?? "",
  };
}
export default function NewQuote({ loaderData: d }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <Link to="/deals" className="text-sm text-primary">
        Back to quotes and deals
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Build a quote</h1>
      <p className="mt-2 text-muted-foreground">
        Choose the trailer, add options and confirm the total with your
        customer.
      </p>
      <QuoteBuilder
        customers={d.customers}
        trailers={d.trailers}
        defaults={d.defaults}
        trailerId={d.trailerId}
        customerId={d.customerId}
      />
    </StaffShell>
  );
}
