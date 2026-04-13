import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDb } from "@/db";
import {
  videos,
  contentLinks,
  content,
  collectionItems,
  collections,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const { id } = await params;
  const poemId = Number(id);
  const db = getDb();
  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, poemId));
  if (!video)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [linkedEssay] = await db
    .select({
      linkId: contentLinks.id,
      contentId: content.id,
      title: content.title,
      type: content.type,
    })
    .from(contentLinks)
    .innerJoin(content, eq(content.id, contentLinks.contentId))
    .where(eq(contentLinks.videoId, poemId))
    .limit(1);

  const memberCollections = await db
    .select({
      id: collections.id,
      title: collections.title,
      slug: collections.slug,
    })
    .from(collectionItems)
    .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
    .where(
      and(
        eq(collectionItems.linkedType, "video"),
        eq(collectionItems.linkedId, poemId)
      )
    )
    .orderBy(asc(collections.title));

  return NextResponse.json({
    ...video,
    linkedEssay: linkedEssay ?? null,
    memberCollections,
  });
}
