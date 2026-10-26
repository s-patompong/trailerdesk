import { useState } from "react";
import { useRevalidator } from "react-router";
import { z } from "zod";

import { requestJson } from "../../lib/request-json";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export function PhotoGallery({
  id,
  photos,
  canManage,
  slug,
}: {
  id: string;
  photos: { id: string; cover: boolean }[];
  canManage: boolean;
  slug?: string;
}) {
  const { pending, error, choose } = useCoverPhoto(id);
  if (!photos.length) return null;
  return (
    <section aria-label="Trailer photos" className="mt-6 space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="space-y-2 rounded-xl border bg-card p-3"
          >
            <a
              href={
                slug
                  ? `/api/public/${encodeURIComponent(slug)}/photos/${photo.id}`
                  : `/api/photos/${photo.id}`
              }
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={
                  slug
                    ? `/api/public/${encodeURIComponent(slug)}/photos/${photo.id}`
                    : `/api/photos/${photo.id}`
                }
                alt={`Trailer view ${String(index + 1)}`}
                width={480}
                height={320}
                loading="lazy"
                className="aspect-video w-full rounded-lg object-cover"
              />
            </a>
            {photo.cover ? (
              <Badge variant="secondary">Cover photo</Badge>
            ) : (
              canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    void choose(photo.id);
                  }}
                >
                  Use as cover
                </Button>
              )
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function useCoverPhoto(id: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const refresh = useRevalidator();
  async function choose(photoId: string) {
    setPending(true);
    try {
      await requestJson(
        `/api/inventory/${id}/photos/${photoId}/cover`,
        z.object({ saved: z.boolean() }),
        { method: "POST" },
      );
      await refresh.revalidate();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The cover photo could not be saved.",
      );
    } finally {
      setPending(false);
    }
  }
  return { pending, error, choose };
}
