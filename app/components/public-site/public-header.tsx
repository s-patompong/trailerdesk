import { MapPin, Phone, Truck } from "lucide-react";
import { Link } from "react-router";

import { Button } from "../ui/button";

export function PublicHeader({
  name,
  slug,
  phone,
  address,
  hasLogo,
}: {
  name: string;
  slug: string;
  phone: string;
  address: string;
  hasLogo?: boolean;
}) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link
          to={`/d/${slug}`}
          className="flex items-center gap-3 text-lg font-bold tracking-tight text-primary"
        >
          {hasLogo ? (
            <img
              src={`/api/public/${encodeURIComponent(slug)}/logo`}
              alt={`${name} logo`}
              width={48}
              height={48}
              className="size-12 object-contain"
            />
          ) : (
            <Truck className="size-7" aria-hidden="true" />
          )}
          {name}
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            {address}
          </span>
          <Button asChild variant="outline">
            <a href={`tel:${phone.replaceAll(/[^+\d]/g, "")}`}>
              <Phone aria-hidden="true" />
              {phone}
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
