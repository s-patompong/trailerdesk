import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";

import { TrailerImage } from "./trailer-image";

import type { listInventory } from "../../../server/features/inventory/inventory.service";

export function TrailerCard({
  trailer,
}: {
  trailer: Awaited<ReturnType<typeof listInventory>>[number] & {
    daysOnLot: number;
  };
}) {
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return (
    <Card className="group gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
      <Link
        to={`/inventory/${trailer.id}`}
        className="block rounded-xl outline-offset-4"
      >
        <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-muted to-primary/5">
          <TrailerImage
            id={trailer.id}
            type={trailer.type}
            title={`${String(trailer.year)} ${trailer.make} ${trailer.model}`}
            photoId={trailer.coverPhotoId}
          />
          <Badge
            variant={trailer.status === "in_stock" ? "default" : "secondary"}
            className="absolute top-4 left-4 capitalize"
          >
            {trailer.status.replaceAll("_", " ")}
          </Badge>
          <Badge
            variant="outline"
            className="absolute top-4 right-4 bg-background/90"
          >
            {trailer.condition === "new" ? "New" : "Pre-owned"}
          </Badge>
        </div>
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              STOCK #{trailer.stockNumber}
            </p>
            <h2 className="mt-1 flex items-start justify-between gap-3 text-lg font-semibold tracking-tight">
              {trailer.year} {trailer.make} {trailer.model}
              <ArrowUpRight
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {trailer.size} · {trailer.gvwr.toLocaleString("en-US")} lb GVWR ·{" "}
              {trailer.axles} axles
            </p>
          </div>
          <Separator />
          <div className="flex items-end justify-between gap-2">
            <strong className="text-2xl font-semibold tracking-tight">
              {money.format(trailer.askingPriceCents / 100)}
            </strong>
            <Badge
              variant={trailer.daysOnLot >= 90 ? "outline" : "secondary"}
              className={
                trailer.daysOnLot >= 90
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : ""
              }
            >
              {trailer.daysOnLot} days on lot
            </Badge>
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden="true" />
            {trailer.lotLocation}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
