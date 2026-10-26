import { env } from "cloudflare:workers";

import { getDashboard } from "../../server/features/dashboard/dashboard.service";
import { AttentionList } from "../components/dashboard/attention-list";
import { StatCard } from "../components/dashboard/stat-card";
import { StaffShell } from "../components/layout/staff-shell";
import {
  staffIdentityContext,
  staffPageInfoContext,
} from "../lib/staff-request-context";

import type { Route } from "./+types/dashboard";

export function meta() {
  return [{ title: "Overview | TrailerDesk" }];
}
export async function loader({ context }: Route.LoaderArgs) {
  const info = context.get(staffPageInfoContext);
  return {
    ...info,
    dashboard: await getDashboard(context.get(staffIdentityContext), env),
  };
}
export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const stats = loaderData.dashboard;
  return (
    <StaffShell
      stores={loaderData.organizations}
      activeId={loaderData.activeOrganizationId}
      role={loaderData.role}
    >
      <header className="mb-7">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          Your dealership
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          A clear view of the day
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          See what is moving, and what needs your attention.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Trailers in stock"
          value={String(stats.inStock)}
          detail="Ready for the next customer"
        />
        <StatCard
          label="New leads this week"
          value={String(stats.newLeads)}
          detail="Since Sunday in your store's timezone"
        />
        <StatCard
          label="Deals this month"
          value={String(stats.dealsThisMonth)}
          detail="Completed trailer sales"
        />
        <StatCard
          label="Average days on lot"
          value={String(stats.averageDays)}
          detail="For trailers currently in stock"
        />
        {stats.inventoryValueCents !== undefined && (
          <StatCard
            label="Inventory value"
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(stats.inventoryValueCents / 100)}
            detail="Asking prices of in-stock trailers"
          />
        )}
      </div>
      <AttentionList data={stats} />
    </StaffShell>
  );
}
