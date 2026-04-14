"use client";

import { useMemo, useState, useCallback } from "react";
import Image from "next/image";
import type { GalleryPhoto } from "@/db/schema";
import { GalleryShakeItButton } from "@/components/gallery/gallery-shake-it-button";

const PAGE_SIZE  = 24;
const CELL_HEIGHT = 260; // px — base row unit

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
  /**
   * Mixed into the shuffle seed on each server render so a full page reload can
   * show a different slice/order than the last visit (still deterministic for
   * SSR + first client paint).
   */
  shuffleSalt: number;
  /** When set, title row (SectionHeader layout) includes the refresh control on the right. */
  collectionTitle?: string;
  collectionDescription?: string;
}

export function GalleryMosaic({
  photos,
  featuredPhoto,
  shuffleSalt,
  collectionTitle,
  collectionDescription,
}: GalleryMosaicProps) {
  const [epoch, setEpoch] = useState(0);
  const [fading, setFading] = useState(false);

  // Shuffle + assign spans in one pass so both change together on refresh.
  // Seed from epoch + sum of photo IDs → same result on server and client
  // for the same epoch, eliminating the SSR/hydration mismatch.
  const cells = useMemo((): CellSpec[] => {
    const pool = photos.filter((p) => p.id !== featuredPhoto?.id);
    const base = pool.reduce((acc, p) => acc + p.id, epoch * 1_000_007);
    const seed = (base ^ shuffleSalt ^ Math.imul(shuffleSalt | 1, 265_443_5761)) >>> 0;
    const rand = seededRand(seed);
    const shuffled = fisherYatesShuffle(pool, rand);
    const page = shuffled.slice(0, featuredPhoto ? PAGE_SIZE - 1 : PAGE_SIZE);
    return page.map((photo) => ({
      photo,
      ...computeSpan(photo, rand()),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, featuredPhoto, epoch, shuffleSalt]);

  const poolLength = photos.filter((p) => p.id !== featuredPhoto?.id).length;
  /** Reshuffle / reload mosaic whenever there is at least one tile outside the featured slot. */
  const showRefresh = poolLength > 0;

  const refresh = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setEpoch((e) => e + 1);
      setFading(false);
    }, 180);
  }, []);

  if (photos.length === 0 && !featuredPhoto) {
    return <p className="text-muted-foreground text-sm">No photos yet.</p>;
  }

  const refreshButton = showRefresh ? (
    <GalleryShakeItButton
      onClick={refresh}
      className="shrink-0 self-start sm:mt-1"
    />
  ) : null;

  return (
    <div className="space-y-6">
      {collectionTitle !== undefined && (
        <div
          className="sticky z-30 -mx-6 mb-12 border-b border-border bg-background px-6 pb-6 pt-3"
          style={{ top: "var(--site-header-height)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between gap-x-8">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-4xl tracking-wide">{collectionTitle}</h1>
              {collectionDescription ? (
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-prose">
                  {collectionDescription}
                </p>
              ) : null}
            </div>
            {refreshButton}
          </div>
        </div>
      )}

      <div
        className="transition-opacity duration-200"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {/*
          grid-auto-flow: dense — browser backfills gaps left by large cells,
          producing a tight, irregular mosaic rather than leaving holes.
          2 cols on mobile, 3 on sm+.
        */}
        {/*
          bg-background (not bg-border): empty implicit grid tracks must read as “holes”
          in the page, not solid tiles. Hairline separations still come from gap-px between
          figures (surface) and this backdrop.
        */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-background"
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

      {collectionTitle === undefined && showRefresh && (
        <div className="flex justify-center pt-2 pb-8">{refreshButton}</div>
      )}
    </div>
  );
}
