import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDb } from "@/db";
import { collections, collectionItems, videos } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const { id } = await params;
  const db = getDb();

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, Number(id)));
  if (!collection)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await db
    .select({
      id: collectionItems.id,
      position: collectionItems.position,
      linkedType: collectionItems.linkedType,
      linkedId: collectionItems.linkedId,
      title: videos.title,
      slug: videos.slug,
      vimeoId: videos.vimeoId,
      thumbnailUrl: videos.thumbnailUrl,
      thumbnailAlt: videos.thumbnailAlt,
      durationSeconds: videos.durationSeconds,
    })
    .from(collectionItems)
    .innerJoin(
      videos,
      and(
        eq(collectionItems.linkedType, "video"),
        eq(collectionItems.linkedId, videos.id)
      )
    )
    .where(eq(collectionItems.collectionId, collection.id))
    .orderBy(asc(collectionItems.position));

  return NextResponse.json({ ...collection, items });
}
