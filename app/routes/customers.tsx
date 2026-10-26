import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { listCustomers } from "../../server/features/customers/customers.service";
import { authInfo } from "../../server/platform/session";
import { CustomerForm } from "../components/customers/customer-form";
import { StaffShell } from "../components/layout/staff-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/customers";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  return {
    ...info,
    customers: await listCustomers(
      request,
      env,
      new URL(request.url).searchParams.get("q") ?? "",
    ),
  };
}
export default function Customers({ loaderData }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={loaderData.organizations}
      activeId={loaderData.activeOrganizationId}
      role={loaderData.role}
    >
      <h1 className="text-3xl font-semibold">Customers</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        The people behind every inquiry, quote and sale.
      </p>
      <CustomerForm />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loaderData.customers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <CardTitle>
                <Link
                  to={`/customers/${customer.id}`}
                  className="hover:text-primary"
                >
                  {customer.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{customer.email}</p>
              <p>{customer.phone || "No phone added"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!loaderData.customers.length && (
        <p className="mt-8 text-muted-foreground">
          No customers yet. Add someone above or receive your first inquiry.
        </p>
      )}
    </StaffShell>
  );
}
