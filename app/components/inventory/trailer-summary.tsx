import { formatMoney } from "../../../server/platform/money";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

import { TrailerImage } from "./trailer-image";
import { TrailerSpecifications } from "./trailer-specifications";

import type { getInventory } from "../../../server/features/inventory/inventory.service";

export function TrailerSummary({
  trailer,
}: {
  trailer: Awaited<ReturnType<typeof getInventory>>["trailer"];
}) {
  return (
    <>
      {" "}
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Stock #{trailer.stockNumber}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {trailer.year} {trailer.make} {trailer.model}
          </h1>
        </div>
        <Badge className="capitalize">
          {trailer.status.replaceAll("_", " ")}
        </Badge>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 overflow-hidden p-0">
          <div className="relative aspect-video">
            <TrailerImage
              id={trailer.id}
              type={trailer.type}
              title={`${String(trailer.year)} ${trailer.make}`}
              photoId={trailer.coverPhotoId}
            />
          </div>
          <CardContent className="space-y-3 p-6">
            <strong className="text-3xl font-semibold">
              {formatMoney(trailer.askingPriceCents)}
            </strong>
            <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
              {trailer.description || "No listing description yet."}
            </p>
          </CardContent>
        </Card>
        <TrailerSpecifications trailer={trailer} />
      </div>
    </>
  );
}
