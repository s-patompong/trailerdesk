import { Form, useNavigation } from "react-router";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

import { HoldForm } from "./hold-form";

import type { listCustomers } from "../../../server/features/customers/customers.service";
import type { readTrailerHold } from "../../../server/features/holds/holds.service";

type Hold = Awaited<ReturnType<typeof readTrailerHold>>;
export function HoldPanel({
  customers,
  hold,
  canManage,
  available,
  timezone,
  durationLabel,
}: {
  customers: Awaited<ReturnType<typeof listCustomers>>;
  hold: Hold;
  canManage: boolean;
  available: boolean;
  timezone: string;
  durationLabel: string;
}) {
  const pending = useNavigation().state !== "idle";
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Customer hold</CardTitle>
        <CardDescription>
          {hold
            ? "This trailer is reserved."
            : `Reserve an available trailer for one customer for ${durationLabel}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hold ? (
          <div className="space-y-4">
            <p className="text-sm">
              <strong>{hold.salespersonName}</strong> is holding this trailer
              for <strong>{hold.customerName}</strong> until{" "}
              {new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(hold.expiresAt))}{" "}
              ({timezone.replaceAll("_", " ")}).
            </p>
            {canManage && (
              <Form method="post" className="flex gap-3">
                <Button
                  name="intent"
                  value="release"
                  variant="outline"
                  disabled={pending}
                >
                  Release hold
                </Button>
                <Button
                  name="intent"
                  value="extend"
                  variant="secondary"
                  disabled={pending}
                >
                  Extend hold
                </Button>
              </Form>
            )}
          </div>
        ) : available ? (
          <HoldForm customers={customers} />
        ) : (
          <p className="text-sm text-muted-foreground">
            This trailer is not currently available for a hold.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
