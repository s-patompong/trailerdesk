import { Link } from "react-router";

import { formatMoney } from "../../../server/platform/money";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export function InventoryTable({
  trailers,
}: {
  trailers: {
    id: string;
    stockNumber: string;
    year: number;
    make: string;
    model: string;
    size: string;
    askingPriceCents: number;
    status: string;
    daysOnLot: number;
  }[];
}) {
  return (
    <div className="mt-6 rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stock #</TableHead>
            <TableHead>Trailer</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Days on lot</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trailers.map((trailer) => (
            <TableRow key={trailer.id}>
              <TableCell>{trailer.stockNumber}</TableCell>
              <TableCell>
                <Link
                  to={`/inventory/${trailer.id}`}
                  className="font-medium text-primary"
                >
                  {trailer.year} {trailer.make} {trailer.model}
                </Link>
              </TableCell>
              <TableCell>{trailer.size}</TableCell>
              <TableCell>{formatMoney(trailer.askingPriceCents)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {trailer.status.replaceAll("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>{trailer.daysOnLot}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
