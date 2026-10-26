import { env } from "cloudflare:workers";
import { data } from "react-router";

import { publicFilters } from "../../server/features/public-site/public-site.schemas";
import { browseDealership } from "../../server/features/public-site/public-site.service";
import { throwHttpError } from "../../server/platform/errors";
import { PublicCard } from "../components/public-site/public-card";
import { PublicFilters } from "../components/public-site/public-filters";
import { PublicHeader } from "../components/public-site/public-header";
import { AskPanel } from "../components/search/ask-panel";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/public-inventory";

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}
export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: `${loaderData.name} | Find your next trailer`,
    },
  ];
}
export async function loader({ params, request }: Route.LoaderArgs) {
  const parsed = publicFilters.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const filters = parsed.success ? parsed.data : publicFilters.parse({});
  try {
    return data(
      {
        ...(await browseDealership(env, params.slug, filters)),
        filters,
        error: parsed.success
          ? null
          : "Please check your filters and try again.",
      },
      {
        status: parsed.success ? 200 : 400,
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return throwHttpError(error);
  }
}
export default function PublicInventory({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <PublicHeader
        name={loaderData.name}
        slug={loaderData.slug}
        phone={loaderData.profile.phone}
        address={loaderData.profile.address}
        hasLogo={loaderData.profile.hasLogo}
      />
      <main className="mx-auto max-w-7xl px-5 py-10">
        <section className="mb-9 max-w-2xl">
          <Badge variant="secondary">Built for the way you work</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            The right trailer.
            <br />
            Ready for what comes next.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Browse trailers from {loaderData.name}. Get the details, find your
            fit, and talk to a team that knows trailers.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {loaderData.profile.hours}
          </p>
        </section>
        <PublicFilters
          key={JSON.stringify(loaderData.filters)}
          values={loaderData.filters}
        />
        {loaderData.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{loaderData.error}</AlertDescription>
          </Alert>
        )}
        {loaderData.inventory.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loaderData.inventory.map((trailer) => (
              <PublicCard
                key={trailer.id}
                trailer={trailer}
                slug={loaderData.slug}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed text-center">
            <CardHeader>
              <CardTitle>No trailers match just yet</CardTitle>
              <CardDescription>
                Try a different type or price, or give the dealership a call.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        <AskPanel slug={loaderData.slug} />
      </main>
    </>
  );
}
