import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { content, contentLinks, videos, collections } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  // "new" returns only the dropdown lists (no content row / no links)
  if (id === "new") {
    const [videoList, collectionList] = await Promise.all([
      db
        .select({ id: videos.id, title: videos.title, slug: videos.slug })
        .from(videos)
        .orderBy(asc(videos.title)),
      db
        .select({
          id: collections.id,
          title: collections.title,
          slug: collections.slug,
        })
        .from(collections)
        .orderBy(asc(collections.title)),
    ]);
    return NextResponse.json({
      content: null,
      links: [],
      videos: videoList,
      collections: collectionList,
    });
  }

  const contentId = Number(id);

  const [row] = await db
    .select()
    .from(content)
    .where(eq(content.id, contentId));
  if (!row)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [linkRows, videoList, collectionList] = await Promise.all([
    db
      .select({
        id: contentLinks.id,
        videoId: contentLinks.videoId,
        videoTitle: videos.title,
        collectionId: contentLinks.collectionId,
        collectionTitle: collections.title,
      })
      .from(contentLinks)
      .leftJoin(videos, eq(contentLinks.videoId, videos.id))
      .leftJoin(collections, eq(contentLinks.collectionId, collections.id))
      .where(eq(contentLinks.contentId, contentId)),
    db
      .select({ id: videos.id, title: videos.title, slug: videos.slug })
      .from(videos)
      .orderBy(asc(videos.title)),
    db
      .select({ id: collections.id, title: collections.title, slug: collections.slug })
      .from(collections)
      .orderBy(asc(collections.title)),
  ]);

  const links = linkRows.map((l) => ({
    id: l.id,
    videoId: l.videoId ?? undefined,
    videoTitle: l.videoTitle ?? undefined,
    collectionId: l.collectionId ?? undefined,
    collectionTitle: l.collectionTitle ?? undefined,
  }));

  return NextResponse.json({
    content: row,
    links,
    videos: videoList,
    collections: collectionList,
  });
}
