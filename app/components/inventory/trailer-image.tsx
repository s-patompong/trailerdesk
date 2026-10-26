import { ImageOff } from "lucide-react";

import { Badge } from "../ui/badge";

const demoImages: Record<string, string> = {
  utility: "/images/demo/utility.jpg",
  enclosed: "/images/demo/enclosed.jpg",
  car_hauler: "/images/demo/car_hauler.jpg",
  dump: "/images/demo/dump.jpg",
  equipment: "/images/demo/equipment.jpg",
  gooseneck: "/images/demo/gooseneck.jpg",
  horse_livestock: "/images/demo/horse_livestock.jpg",
};
export function TrailerImage({
  id,
  type,
  title,
  photoId,
  publicSlug,
}: {
  id: string;
  type: string;
  title: string;
  photoId: string | null;
  publicSlug?: string;
}) {
  const demoImage = id.startsWith("trailer-") ? demoImages[type] : undefined;
  const source = photoId
    ? publicSlug
      ? `/api/public/${encodeURIComponent(publicSlug)}/photos/${encodeURIComponent(photoId)}`
      : `/api/photos/${encodeURIComponent(photoId)}`
    : demoImage;
  if (!source)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <ImageOff className="size-9" aria-hidden="true" />
        <span className="text-xs">No photos yet</span>
      </div>
    );
  return (
    <>
      <img
        src={source}
        alt={
          demoImage && !photoId
            ? `Illustrative ${type.replaceAll("_", " ")} trailer demo image`
            : title
        }
        width={1200}
        height={675}
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
      {demoImage && !photoId && (
        <Badge
          variant="secondary"
          className="absolute right-3 bottom-3 border border-white/40 bg-white/90 text-[10px] text-slate-600"
        >
          Demo image
        </Badge>
      )}
    </>
  );
}
