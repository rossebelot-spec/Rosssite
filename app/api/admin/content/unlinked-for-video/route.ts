import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDb } from "@/db";
import { content } from "@/db/schema";
import { and, asc, inArray, notInArray } from "drizzle-orm";
import { getContentIdsLinkedToVideo } from "@/lib/content-video-links";

/**
 * Essay/blog rows that are not linked to any video (`content_links.video_id`).
 * Used by the video editor to attach an existing piece.
 */
export async function GET() {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const db = getDb();
  const linkedIds = await getContentIdsLinkedToVideo();

  const conditions = [inArray(content.type, ["essay", "blog"])];
  if (linkedIds.length > 0) {
    conditions.push(notInArray(content.id, linkedIds));
  }

  const rows = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      type: content.type,
    })
    .from(content)
    .where(and(...conditions))
    .orderBy(asc(content.title));

  return NextResponse.json({ items: rows });
}
