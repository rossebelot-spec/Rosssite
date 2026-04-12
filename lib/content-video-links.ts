import { getDb } from "@/db";
import { contentLinks } from "@/db/schema";
import { isNotNull } from "drizzle-orm";

/** Content rows that have at least one `content_links` row with a `video_id`. */
export async function getContentIdsLinkedToVideo(): Promise<number[]> {
  const db = getDb();
  const rows = await db
    .select({ contentId: contentLinks.contentId })
    .from(contentLinks)
    .where(isNotNull(contentLinks.videoId));
  return [...new Set(rows.map((r) => r.contentId))];
}
