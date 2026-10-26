import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

import type { getInventory } from "../../../server/features/inventory/inventory.service";
export function TrailerSpecifications({
  trailer,
}: {
  trailer: Awaited<ReturnType<typeof getInventory>>["trailer"];
}) {
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trailer specifications</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries({
            VIN: trailer.vin,
            Size: trailer.size,
            GVWR: `${trailer.gvwr.toLocaleString("en-US")} lb`,
            Axles: String(trailer.axles),
            Hitch: trailer.hitchType.replaceAll("_", " "),
            Doors: trailer.doorType,
            Color: trailer.color,
            Condition: trailer.condition,
            Location: trailer.lotLocation,
          }).map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {trailer.dealerCostCents !== undefined && (
          <p className="mt-6 border-t pt-4 text-sm">
            Dealer cost{" "}
            <strong className="float-right">
              {money.format(trailer.dealerCostCents / 100)}
            </strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
