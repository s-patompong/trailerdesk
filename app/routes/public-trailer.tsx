import { env } from "cloudflare:workers";
import { data, Link } from "react-router";

import { inquiryInput } from "../../server/features/public-site/public-site.schemas";
import {
  browseDealership,
  submitInquiry,
} from "../../server/features/public-site/public-site.service";
import { configuration } from "../../server/platform/config";
import { DomainError, throwHttpError } from "../../server/platform/errors";
import { PhotoGallery } from "../components/inventory/photo-gallery";
import { TrailerImage } from "../components/inventory/trailer-image";
import { InquiryForm } from "../components/public-site/inquiry-form";
import { PublicHeader } from "../components/public-site/public-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

import type { Route } from "./+types/public-trailer";

export function headers({ actionHeaders, loaderHeaders }: Route.HeadersArgs) {
  return actionHeaders.has("Cache-Control") ? actionHeaders : loaderHeaders;
}
export async function loader({ params }: Route.LoaderArgs) {
  try {
    const store = await browseDealership(env, params.slug, {}, params.id);
    const trailer = store.inventory[0];
    if (!trailer)
      throw new DomainError("not_found", "That trailer is no longer listed.");
    return data(
      { ...store, trailer, siteKey: configuration(env).turnstile.siteKey },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
    );
  } catch (error) {
    return throwHttpError(error);
  }
}
export async function action({ params, request }: Route.ActionArgs) {
  const parsed = inquiryInput.safeParse(
    Object.fromEntries(await request.formData()),
  );
  const headers = { "Cache-Control": "private, no-store" };
  if (!parsed.success)
    return data(
      {
        accepted: false,
        error:
          "Please check your contact details and complete the verification.",
        attemptId: crypto.randomUUID(),
      },
      { status: 400, headers },
    );
  try {
    await submitInquiry(request, env, params.slug, {
      ...parsed.data,
      trailerId: params.id,
    });
    return data(
      { accepted: true, error: undefined, attemptId: undefined },
      { headers },
    );
  } catch (error) {
    return data(
      {
        accepted: false,
        error:
          error instanceof DomainError
            ? error.message
            : "Your inquiry could not be sent. Please try again or call the dealership.",
        attemptId: crypto.randomUUID(),
      },
      {
        status:
          error instanceof DomainError && error.code === "rate_limited"
            ? 429
            : 400,
        headers,
      },
    );
  }
}
export default function PublicTrailer({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { trailer } = loaderData;
  return (
    <>
      <PublicHeader
        name={loaderData.name}
        slug={loaderData.slug}
        phone={loaderData.profile.phone}
        address={loaderData.profile.address}
        hasLogo={loaderData.profile.hasLogo}
      />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Button asChild variant="link" className="mb-5 px-0">
          <Link to={`/d/${loaderData.slug}`}>← All trailers</Link>
        </Button>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            {trailer.year} {trailer.make} {trailer.model}
          </h1>
          <Badge className="capitalize">
            {trailer.status.replaceAll("_", " ")}
          </Badge>
        </div>
        <Card className="gap-0 overflow-hidden p-0">
          <div className="relative aspect-video">
            <TrailerImage
              id={trailer.id}
              type={trailer.type}
              title={`${String(trailer.year)} ${trailer.make}`}
              photoId={trailer.coverPhotoId}
              publicSlug={loaderData.slug}
            />
          </div>
          <CardContent className="space-y-4 p-6">
            <p className="text-3xl font-semibold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(trailer.askingPriceCents / 100)}
            </p>
            <p className="text-sm text-muted-foreground">
              {trailer.size} · {trailer.gvwr.toLocaleString("en-US")} lb GVWR ·{" "}
              {trailer.axles} axles · {trailer.hitchType.replaceAll("_", " ")} ·{" "}
              {trailer.doorType} doors
            </p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {trailer.description}
            </p>
          </CardContent>
        </Card>
        <InquiryForm
          trailerId={trailer.id}
          siteKey={loaderData.siteKey}
          error={actionData?.error}
          accepted={actionData?.accepted ?? false}
          attemptId={actionData?.attemptId}
        />
        <PhotoGallery
          id={trailer.id}
          photos={loaderData.photos}
          canManage={false}
          slug={loaderData.slug}
        />
      </main>
    </>
  );
}
