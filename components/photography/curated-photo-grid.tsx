import Image from "next/image";
import { blobImageUrl } from "@/lib/blob";

interface CuratedPhoto {
  id: number;
  blobUrl: string;
  caption: string;
  alt: string;
}

interface Props {
  photos: CuratedPhoto[];
  collectionTitle: string;
  collectionDescription?: string;
}

export function CuratedPhotoGrid({ photos, collectionTitle, collectionDescription }: Props) {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3 max-w-xl">
        <h1 className="font-heading text-4xl">{collectionTitle}</h1>
        {collectionDescription && (
          <p className="text-muted-foreground leading-relaxed">{collectionDescription}</p>
        )}
        <p className="text-xs text-muted-foreground tracking-widest uppercase">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* CSS columns masonry — natural aspect ratios, mixed orientations */}
      <div
        className="columns-1 sm:columns-2 lg:columns-3 gap-4"
        style={{ columnGap: "1rem" }}
      >
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="break-inside-avoid mb-4 group"
          >
            {/* Natural aspect ratio — no forced crop */}
            <div className="relative w-full overflow-hidden rounded bg-muted">
              <Image
                src={blobImageUrl(photo.blobUrl)}
                alt={photo.alt || photo.caption || collectionTitle}
                width={800}
                height={600}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="w-full h-auto object-contain transition-opacity group-hover:opacity-95"
                style={{ display: "block" }}
              />
            </div>
            {photo.caption && (
              <figcaption className="mt-2 text-xs text-muted-foreground leading-relaxed px-0.5">
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {photos.length === 0 && (
        <p className="text-muted-foreground text-sm">No photos in this collection yet.</p>
      )}
    </div>
  );
}
