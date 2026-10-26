import { Link } from "react-router";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import type { getDashboard } from "../../../server/features/dashboard/dashboard.service";

export function AttentionList({
  data,
}: {
  data: Awaited<ReturnType<typeof getDashboard>>;
}) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <AgingInventory data={data} />
      <ActiveHolds data={data} />
    </div>
  );
}
function AgingInventory({
  data,
}: {
  data: Awaited<ReturnType<typeof getDashboard>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Worth another look</CardTitle>
        <CardDescription>
          In-stock trailers on the lot for {data.agingThresholdDays} days or
          more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.aging.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trailer</TableHead>
                <TableHead>Stock number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.aging.map((trailer) => (
                <TableRow key={trailer.id}>
                  <TableCell>
                    <Button
                      asChild
                      variant="link"
                      className="h-auto px-0 text-left whitespace-normal"
                    >
                      <Link to={`/inventory/${trailer.id}`}>
                        {trailer.year} {trailer.make} {trailer.model}
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell>{trailer.stockNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No aging trailers. Your lot is moving.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
function ActiveHolds({
  data,
}: {
  data: Awaited<ReturnType<typeof getDashboard>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active customer holds</CardTitle>
        <CardDescription>Reservations your team is working on.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.holds.length ? (
          data.holds.map((hold) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              key={hold.id}
            >
              <Button asChild variant="link" className="px-0">
                <Link to={`/inventory/${hold.trailerId}`}>
                  Open held trailer
                </Link>
              </Button>
              <Badge variant="secondary">
                Until{" "}
                {new Intl.DateTimeFormat("en-US", {
                  timeZone: data.timezone,
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(hold.expiresAt))}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No trailers are on hold right now.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
