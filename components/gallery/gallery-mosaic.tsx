"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import type { GalleryPhoto } from "@/db/schema";

const PAGE_SIZE  = 24;
const CELL_HEIGHT = 260; // px — base row unit

const REFRESH_LABELS = [
  "New set →",
  "Show me more →",
  "Surprise me →",
  "Again →",
  "Keep going →",
  "Different light →",
  "One more →",
  "Go on →",
];

/**
 * Tiny seeded PRNG (mulberry32). Given the same seed, produces the same
 * sequence on server and client, preventing SSR/hydration mismatches.
 */
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return function next() {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0xffffffff;
  };
}

interface CellSpec {
  photo: GalleryPhoto;
  colSpan: number;
  rowSpan: number;
}

/**
 * Deterministic shuffle: fixed (n−1) calls to `rand` in a fixed order.
 * Do not use `Array.prototype.sort` with a random comparator — it is neither
 * valid (comparator must be stable per pair) nor consistent between SSR and the client.
 */
function fisherYatesShuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

/** Assign grid spans based on aspect ratio + seeded random value (0–1). */
function computeSpan(photo: GalleryPhoto, rand: number): { colSpan: number; rowSpan: number } {
  const ratio =
    photo.width && photo.height ? photo.width / photo.height : 1;

  // Portrait — always give extra height so the image isn't cropped
  if (ratio < 0.75) return { colSpan: 1, rowSpan: 2 };

  // Panoramic / very wide — always span two columns
  if (ratio > 1.9) return { colSpan: 2, rowSpan: 1 };

  // Random large feature block (~12% of remaining)
  if (rand < 0.12) return { colSpan: 2, rowSpan: 2 };

  // Random wide accent (~20% of remaining)
  if (rand < 0.32) return { colSpan: 2, rowSpan: 1 };

  // Standard cell
  return { colSpan: 1, rowSpan: 1 };
}

interface GalleryMosaicProps {
  photos: GalleryPhoto[];
  featuredPhoto: GalleryPhoto | null;
}

export function GalleryMosaic({ photos, featuredPhoto }: GalleryMosaicProps) {
  const [epoch, setEpoch] = useState(0);
  const [fading, setFading] = useState(false);
  const labelIndexRef = useRef(0);

  // Shuffle + assign spans in one pass so both change together on refresh.
  // Seed from epoch + sum of photo IDs → same result on server and client
  // for the same epoch, eliminating the SSR/hydration mismatch.
  const cells = useMemo((): CellSpec[] => {
    const pool = photos.filter((p) => p.id !== featuredPhoto?.id);
    const seed = pool.reduce((acc, p) => acc + p.id, epoch * 1_000_007);
    const rand = seededRand(seed);
    const shuffled = fisherYatesShuffle(pool, rand);
    const page = shuffled.slice(0, featuredPhoto ? PAGE_SIZE - 1 : PAGE_SIZE);
    return page.map((photo) => ({
      photo,
      ...computeSpan(photo, rand()),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, featuredPhoto, epoch]);

  const hasMore = photos.filter((p) => p.id !== featuredPhoto?.id).length > PAGE_SIZE;

  const refresh = useCallback(() => {
    labelIndexRef.current = (labelIndexRef.current + 1) % REFRESH_LABELS.length;
    setFading(true);
    setTimeout(() => {
      setEpoch((e) => e + 1);
      setFading(false);
    }, 180);
  }, []);

  if (photos.length === 0 && !featuredPhoto) {
    return <p className="text-muted-foreground text-sm">No photos yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div
        className="transition-opacity duration-200"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {/*
          grid-auto-flow: dense — browser backfills gaps left by large cells,
          producing a tight, irregular mosaic rather than leaving holes.
          2 cols on mobile, 3 on sm+.
        */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border"
          style={{
            gridAutoRows: `${CELL_HEIGHT}px`,
            gridAutoFlow: "dense",
          }}
        >
          {/* Featured — anchored top-left, 2×2, always first in DOM */}
          {featuredPhoto && (
            <figure
              className="col-span-2 row-span-2 relative overflow-hidden bg-surface group"
            >
              <Image
                src={featuredPhoto.r2Url}
                alt={featuredPhoto.title || "Featured photograph"}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 66vw"
                className="object-cover transition-opacity duration-500 group-hover:opacity-90"
              />
              {featuredPhoto.title && (
                <figcaption className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-background/80 to-transparent text-sm text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {featuredPhoto.title}
                </figcaption>
              )}
            </figure>
          )}

          {/* Mosaic cells — spans vary per photo + random */}
          {cells.map(({ photo, colSpan, rowSpan }) => (
            <figure
              key={`${epoch}-${photo.id}`}
              className="relative overflow-hidden bg-surface group"
              style={{
                gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
                gridRow:    rowSpan > 1 ? `span ${rowSpan}` : undefined,
              }}
            >
              <Image
                src={photo.r2Url}
                alt={photo.title || "Photograph"}
                fill
                sizes={
                  colSpan > 1
                    ? "(max-width: 640px) 100vw, 66vw"
                    : "(max-width: 640px) 50vw, 33vw"
                }
                className="object-cover transition-opacity duration-300 group-hover:opacity-85"
              />
              {photo.title && (
                <figcaption className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-background/70 to-transparent text-xs text-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {photo.title}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>

      {/* New set button */}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={refresh}
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded px-6 py-2.5 transition-colors"
          >
            {REFRESH_LABELS[labelIndexRef.current]}
          </button>
        </div>
      )}
    </div>
  );
}
