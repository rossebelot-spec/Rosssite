import { getDb } from "@/db";
import { videos } from "@/db/schema";
import { eq, and, like, ilike, desc } from "drizzle-orm";

/**
 * Preferred slug for the home featured clip (matches the seed script `ON CONFLICT (slug)`).
 *
 * **Collection membership does not affect** this feature: the same `videos` row can be
 * listed in `collection_items` and still be loaded here. Only published + lookup below.
 *
 * Lookup order: exact slug → slug prefix `lac-megantic%` → title contains `Mégantic`
 * (so a surviving “already published” row still appears if its slug drifted after cleanup).
 *
 * `/video` omits the **resolved** featured row by `id` so it does not duplicate in the
 * standalone grid even when the slug is not exactly `lac-megantic`.
 */
export const FEATURED_HOME_VIDEO_SLUG = "lac-megantic";

export type FeaturedHomeVideoRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  vimeoId: string;
  r2Url: string | null;
  thumbnailUrl: string;
};

const featuredSelect = {
  id: videos.id,
  slug: videos.slug,
  title: videos.title,
  description: videos.description,
  vimeoId: videos.vimeoId,
  r2Url: videos.r2Url,
  thumbnailUrl: videos.thumbnailUrl,
} as const;

/** Loads the featured clip for the home page (no join to `collection_items`). */
export async function getFeaturedHomeVideo(): Promise<FeaturedHomeVideoRow | null> {
  const db = getDb();

  const [exact] = await db
    .select(featuredSelect)
    .from(videos)
    .where(and(eq(videos.slug, FEATURED_HOME_VIDEO_SLUG), eq(videos.published, true)))
    .limit(1);
  if (exact) return exact;

  const [prefix] = await db
    .select(featuredSelect)
    .from(videos)
    .where(and(eq(videos.published, true), like(videos.slug, "lac-megantic%")))
    .orderBy(desc(videos.updatedAt))
    .limit(1);
  if (prefix) return prefix;

  const [byTitle] = await db
    .select(featuredSelect)
    .from(videos)
    .where(and(eq(videos.published, true), ilike(videos.title, "%Mégantic%")))
    .orderBy(desc(videos.updatedAt))
    .limit(1);
  if (byTitle) return byTitle;

  const [byTitleAscii] = await db
    .select(featuredSelect)
    .from(videos)
    .where(and(eq(videos.published, true), ilike(videos.title, "%Megantic%")))
    .orderBy(desc(videos.updatedAt))
    .limit(1);
  return byTitleAscii ?? null;
}
