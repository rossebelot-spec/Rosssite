"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { videos, content, contentLinks, type ContentType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import {
  requireAdmin,
  contentPrimaryPaths,
  getCollectionSlugsForVideo,
  isVercelBlobStorageUrl,
} from "@/lib/action-helpers";
import { getContentIdsLinkedToVideo } from "@/lib/content-video-links";

export async function createContent(data: {
  type: ContentType;
  title: string;
  slug: string;
  topic?: string;
  bodyHtml: string;
  description: string;
  tags: string[];
  published: boolean;
  publishedAt?: Date | null;
  imageUrl?: string | null;
  pendingLink?: { videoId?: number; collectionId?: number };
}) {
  await requireAdmin();
  const db = getDb();
  const { pendingLink, ...insertData } = data;

  const [slugTaken] = await db
    .select({ id: content.id })
    .from(content)
    .where(eq(content.slug, insertData.slug))
    .limit(1);
  if (slugTaken) {
    redirect(`/admin/content/${slugTaken.id}`);
  }

  const [row] = await db.insert(content).values(insertData).returning();

  if (pendingLink && (pendingLink.videoId || pendingLink.collectionId)) {
    await db.insert(contentLinks).values({
      contentId: row.id,
      videoId: pendingLink.videoId ?? null,
      collectionId: pendingLink.collectionId ?? null,
    });
    if (pendingLink.videoId) {
      const [vid] = await db
        .select({ slug: videos.slug })
        .from(videos)
        .where(eq(videos.id, pendingLink.videoId));
      if (vid) revalidatePath(`/video/${vid.slug}`);
    }
  }

  for (const path of contentPrimaryPaths(row.type, row.slug)) {
    revalidatePath(path);
  }
  redirect(`/admin/content/${row.id}`);
}

export async function updateContent(
  id: number,
  data: {
    type?: ContentType;
    title?: string;
    slug?: string;
    topic?: string;
    bodyHtml?: string;
    description?: string;
    tags?: string[];
    published?: boolean;
    publishedAt?: Date | null;
    imageUrl?: string | null;
    updatedAt: Date;
  }
) {
  await requireAdmin();
  const db = getDb();
  const [before] = await db
    .select({ imageUrl: content.imageUrl })
    .from(content)
    .where(eq(content.id, id));
  if (before && data.imageUrl !== undefined) {
    const prev = before.imageUrl ?? null;
    const next = data.imageUrl;
    if (prev && prev !== next && isVercelBlobStorageUrl(prev)) {
      try {
        await del(prev);
      } catch {
        /* ignore */
      }
    }
  }
  await db.update(content).set(data).where(eq(content.id, id));

  const [row] = await db
    .select({ type: content.type, slug: content.slug })
    .from(content)
    .where(eq(content.id, id));
  if (row) {
    for (const path of contentPrimaryPaths(row.type, row.slug)) {
      revalidatePath(path);
    }
  }

  const linkedVideos = await db
    .select({ videoId: contentLinks.videoId })
    .from(contentLinks)
    .where(eq(contentLinks.contentId, id));
  for (const { videoId } of linkedVideos) {
    if (videoId == null) continue;
    const [vid] = await db
      .select({ slug: videos.slug })
      .from(videos)
      .where(eq(videos.id, videoId));
    if (vid) revalidatePath(`/video/${vid.slug}`);
    const collSlugs = await getCollectionSlugsForVideo(videoId);
    for (const slug of collSlugs) {
      revalidatePath(`/video/collections/${slug}`);
    }
  }
}

export async function deleteContent(id: number) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db.select().from(content).where(eq(content.id, id));
  if (row?.imageUrl && isVercelBlobStorageUrl(row.imageUrl)) {
    try {
      await del(row.imageUrl);
    } catch {
      /* ignore */
    }
  }
  if (row) {
    for (const path of contentPrimaryPaths(row.type, row.slug)) {
      revalidatePath(path);
    }
  }
  await db.delete(content).where(eq(content.id, id));
  revalidatePath("/essays");
  revalidatePath("/about");
  revalidatePath("/literary");
  revalidatePath("/events");
  redirect("/admin/content");
}

/** Link an existing essay/blog to a video (video must be unlinked; content must not already be linked to any video). */
export async function linkEssayToVideo({
  videoId,
  contentId,
}: {
  videoId: number;
  contentId: number;
}) {
  await requireAdmin();
  const db = getDb();

  const [existingVideoLink] = await db
    .select({ id: contentLinks.id })
    .from(contentLinks)
    .where(eq(contentLinks.videoId, videoId))
    .limit(1);
  if (existingVideoLink) {
    throw new Error("This video already has a linked essay.");
  }

  const linkedIds = await getContentIdsLinkedToVideo();
  if (linkedIds.includes(contentId)) {
    throw new Error("This piece is already linked to a video.");
  }

  const [c] = await db
    .select({ type: content.type })
    .from(content)
    .where(eq(content.id, contentId))
    .limit(1);
  if (!c) {
    throw new Error("Content not found.");
  }
  if (c.type !== "essay" && c.type !== "blog") {
    throw new Error("Only essays and blog posts can be linked to a video.");
  }

  await addContentLink({ contentId, videoId });
}

export async function addContentLink({
  contentId,
  videoId,
  collectionId,
}: {
  contentId: number;
  videoId?: number;
  collectionId?: number;
}) {
  await requireAdmin();
  const db = getDb();
  await db.insert(contentLinks).values({
    contentId,
    videoId: videoId ?? null,
    collectionId: collectionId ?? null,
  });

  const [row] = await db
    .select({ type: content.type, slug: content.slug })
    .from(content)
    .where(eq(content.id, contentId));
  if (row) {
    for (const path of contentPrimaryPaths(row.type, row.slug)) {
      revalidatePath(path);
    }
  }

  if (videoId) {
    const [vid] = await db
      .select({ slug: videos.slug })
      .from(videos)
      .where(eq(videos.id, videoId));
    if (vid) revalidatePath(`/video/${vid.slug}`);
    const collSlugs = await getCollectionSlugsForVideo(videoId);
    for (const slug of collSlugs) {
      revalidatePath(`/video/collections/${slug}`);
    }
  }
}

export async function removeContentLink(linkId: number) {
  await requireAdmin();
  const db = getDb();
  const [link] = await db
    .select()
    .from(contentLinks)
    .where(eq(contentLinks.id, linkId));
  if (!link) return;

  await db.delete(contentLinks).where(eq(contentLinks.id, linkId));

  const [row] = await db
    .select({ type: content.type, slug: content.slug })
    .from(content)
    .where(eq(content.id, link.contentId));
  if (row) {
    for (const path of contentPrimaryPaths(row.type, row.slug)) {
      revalidatePath(path);
    }
  }

  if (link.videoId) {
    const [vid] = await db
      .select({ slug: videos.slug })
      .from(videos)
      .where(eq(videos.id, link.videoId));
    if (vid) revalidatePath(`/video/${vid.slug}`);
    const collSlugs = await getCollectionSlugsForVideo(link.videoId);
    for (const slug of collSlugs) {
      revalidatePath(`/video/collections/${slug}`);
    }
  }
}
