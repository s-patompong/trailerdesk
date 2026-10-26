import { env } from "cloudflare:workers";
import { Plus, Truck } from "lucide-react";
import { data, Link, redirect } from "react-router";

import { inventoryFilters } from "../../server/features/inventory/inventory.schemas";
import { listInventory } from "../../server/features/inventory/inventory.service";
import { authInfo } from "../../server/platform/session";
import { InventoryFilters } from "../components/inventory/inventory-filters";
import { InventoryTable } from "../components/inventory/inventory-table";
import { TrailerCard } from "../components/inventory/trailer-card";
import { StaffShell } from "../components/layout/staff-shell";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/inventory";

export function meta() {
  return [{ title: "Inventory | TrailerDesk" }];
}
export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  const parsed = inventoryFilters.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const filters = parsed.success ? parsed.data : inventoryFilters.parse({});
  const rows = await listInventory(request, env, filters);
  return data(
    {
      ...info,
      filters,
      filterError: parsed.success
        ? null
        : "Some filters were invalid. Showing all trailers.",
      trailers: rows.map((row) => ({
        ...row,
        daysOnLot: Math.max(
          0,
          Math.floor((Date.now() - row.arrivedAt.getTime()) / 86400000),
        ),
      })),
    },
    { status: parsed.success ? 200 : 400 },
  );
}
export default function Inventory({ loaderData }: Route.ComponentProps) {
  const { trailers } = loaderData;
  return (
    <StaffShell
      stores={loaderData.organizations}
      activeId={loaderData.activeOrganizationId}
      role={loaderData.role}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Your lot
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight">
            Inventory<Badge variant="secondary">{trailers.length}</Badge>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The right trailer. The next customer. All in one place.
          </p>
        </div>
        {loaderData.role !== "sales" && (
          <Button asChild>
            <Link to="/inventory/new">
              <Plus aria-hidden="true" />
              Add trailer
            </Link>
          </Button>
        )}
      </header>
      <InventoryFilters
        key={JSON.stringify(loaderData.filters)}
        values={loaderData.filters}
      />
      {loaderData.filterError && (
        <Alert className="mt-4" variant="destructive">
          <AlertDescription>{loaderData.filterError}</AlertDescription>
        </Alert>
      )}
      {trailers.length === 0 ? (
        <Card className="mt-6 border-dashed text-center shadow-none">
          <CardHeader>
            <Truck
              className="mx-auto mb-3 size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <CardTitle>No trailers found</CardTitle>
            <CardDescription>
              Try a different search or add your first trailer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/inventory">Clear filters</Link>
            </Button>
          </CardContent>
        </Card>
      ) : loaderData.filters.view === "table" ? (
        <InventoryTable trailers={trailers} />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {trailers.map((trailer) => (
            <TrailerCard key={trailer.id} trailer={trailer} />
          ))}
        </div>
      )}
    </StaffShell>
  );
}
