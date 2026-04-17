"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import { blobImageUrl } from "@/lib/blob";
import { Button } from "@/components/ui/button";

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

// ── Lightbox ────────────────────────────────────────────────────────────────

interface LightboxProps {
  photos: CuratedPhoto[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function Lightbox({ photos, index, onClose, onPrev, onNext }: LightboxProps) {
  const photo = photos[index]!;
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="curated-lightbox-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/92 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="relative z-10 flex max-h-[92dvh] w-full max-w-5xl flex-col gap-3 rounded-md border border-border bg-surface p-3 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <div className="flex shrink-0 justify-between items-center">
          <span className="text-xs text-muted-foreground tabular-nums">
            {index + 1} / {photos.length}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Image */}
        <div className="relative min-h-0 flex-1 flex items-center justify-center overflow-hidden rounded">
          <Image
            key={photo.id}
            src={blobImageUrl(photo.blobUrl)}
            alt={photo.alt || photo.caption}
            width={1600}
            height={1200}
            sizes="(max-width: 768px) 100vw, 90vw"
            className="max-h-[72dvh] w-auto max-w-full object-contain"
            priority
          />
        </div>

        {/* Title + nav */}
        <div className="shrink-0 flex items-center justify-between gap-4 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {(photo.caption || photo.alt) && (
            <p
              id="curated-lightbox-title"
              className="text-sm text-center text-foreground leading-snug flex-1"
            >
              {photo.caption || photo.alt}
            </p>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next photo"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

// ── Grid ────────────────────────────────────────────────────────────────────

export function CuratedPhotoGrid({ photos, collectionTitle, collectionDescription }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openAt = useCallback((i: number) => setLightboxIndex(i), []);
  const close   = useCallback(() => setLightboxIndex(null), []);
  const prev    = useCallback(() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const next    = useCallback(
    () => setLightboxIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i)),
    [photos.length]
  );

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

      {/* Masonry grid — titles hidden, revealed only in lightbox */}
      <div className="columns-1 sm:columns-2 lg:columns-3" style={{ columnGap: "1rem" }}>
        {photos.map((photo, i) => (
          <figure
            key={photo.id}
            className="break-inside-avoid mb-4 group cursor-zoom-in"
            onClick={() => openAt(i)}
          >
            <div className="relative w-full overflow-hidden rounded bg-muted">
              <Image
                src={blobImageUrl(photo.blobUrl)}
                alt={photo.alt || photo.caption || collectionTitle}
                width={800}
                height={600}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="w-full h-auto object-contain transition-all duration-200 group-hover:opacity-90 group-hover:scale-[1.01]"
                style={{ display: "block" }}
              />
              {/* Subtle hover overlay to hint interactivity */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded" />
            </div>
          </figure>
        ))}
      </div>

      {photos.length === 0 && (
        <p className="text-muted-foreground text-sm">No photos in this collection yet.</p>
      )}

      {/* Lightbox portal */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}
