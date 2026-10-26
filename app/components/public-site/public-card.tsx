import { Link } from "react-router";

import { TrailerImage } from "../inventory/trailer-image";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

import type { browseDealership } from "../../../server/features/public-site/public-site.service";

export function PublicCard({
  trailer,
  slug,
}: {
  trailer: Awaited<ReturnType<typeof browseDealership>>["inventory"][number];
  slug: string;
}) {
  return (
    <Card className="gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
      <Link to={`/d/${slug}/${trailer.id}`}>
        <div className="relative aspect-video">
          <TrailerImage
            id={trailer.id}
            type={trailer.type}
            title={`${String(trailer.year)} ${trailer.make} ${trailer.model}`}
            photoId={trailer.coverPhotoId}
            publicSlug={slug}
          />
          <Badge className="absolute top-3 left-3 capitalize">
            {trailer.status.replaceAll("_", " ")}
          </Badge>
        </div>
        <CardContent className="space-y-2 p-5">
          <h2 className="text-lg font-semibold">
            {trailer.year} {trailer.make} {trailer.model}
          </h2>
          <p className="text-sm text-muted-foreground">
            {trailer.size} · {trailer.gvwr.toLocaleString("en-US")} lb GVWR
          </p>
          <p className="pt-3 text-2xl font-semibold">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(trailer.askingPriceCents / 100)}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
