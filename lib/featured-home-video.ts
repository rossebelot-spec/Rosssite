import { getDb } from "@/db";
import { videos } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Home featured clip: exactly one `videos` row may have `isFeaturedForHome` (set in
 * `/admin/videos/[id]`). Only **published** rows appear on `/`.
 *
 * **Collection membership does not affect** this feature.
 *
 * `/video` omits the **resolved** featured row by `id` so it does not duplicate in the grid.
 *
 * Seed scripts may still use slug `lac-megantic`; the row must also be toggled “featured”
 * in admin (or rely on migration backfill).
 */
export const FEATURED_HOME_VIDEO_SLUG = "lac-megantic";

export type FeaturedHomeVideoRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  r2Url: string | null;
  thumbnailUrl: string;
};

const featuredSelect = {
  id: videos.id,
  slug: videos.slug,
  title: videos.title,
  description: videos.description,
  r2Url: videos.r2Url,
  thumbnailUrl: videos.thumbnailUrl,
} as const;

/** Loads the featured clip for the home page (no join to `collection_items`). */
export async function getFeaturedHomeVideo(): Promise<FeaturedHomeVideoRow | null> {
  const db = getDb();

  const [row] = await db
    .select(featuredSelect)
    .from(videos)
    .where(
      and(eq(videos.isFeaturedForHome, true), eq(videos.published, true))
    )
    .limit(1);
  return row ?? null;
}
