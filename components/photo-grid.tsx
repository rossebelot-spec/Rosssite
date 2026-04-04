import Image from "next/image";
import type { Photo } from "@/db/schema";

interface PhotoGridProps {
  photos: Photo[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No photos yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
      {photos.map((photo) => (
        <figure key={photo.id} className="relative aspect-square overflow-hidden bg-surface group">
          <Image
            src={photo.blobUrl}
            alt={photo.alt || photo.caption || ""}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-opacity duration-300 group-hover:opacity-80"
          />
          {photo.caption && (
            <figcaption className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-background/80 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {photo.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
