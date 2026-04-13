"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { videos, collections, collectionItems } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  requireAdmin,
  getCollectionSlugsForVideo,
  reindexCollectionItemPositions,
} from "@/lib/action-helpers";

export async function setVideoCollections({
  videoId,
  collectionIds,
}: {
  videoId: number;
  collectionIds: number[];
}) {
  await requireAdmin();
  const db = getDb();

  const current = await db
    .select({ collectionId: collectionItems.collectionId })
    .from(collectionItems)
    .where(
      and(
        eq(collectionItems.linkedType, "video"),
        eq(collectionItems.linkedId, videoId)
      )
    );

  const currentIds = new Set(current.map((r) => r.collectionId));
  const targetIds = new Set(collectionIds);
  const toRemove = [...currentIds].filter((id) => !targetIds.has(id));
  const toAdd = collectionIds.filter((id) => !currentIds.has(id));

  for (const collectionId of toRemove) {
    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, collectionId),
          eq(collectionItems.linkedType, "video"),
          eq(collectionItems.linkedId, videoId)
        )
      );
    await reindexCollectionItemPositions(collectionId);
  }

  for (const collectionId of toAdd) {
    const [maxRow] = await db
      .select({
        maxPos: sql<number>`coalesce(max(${collectionItems.position}), -1)`,
      })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId));
    await db.insert(collectionItems).values({
      collectionId,
      linkedType: "video",
      linkedId: videoId,
      position: (maxRow?.maxPos ?? -1) + 1,
    });
  }

  const affectedIds = [...new Set([...toRemove, ...toAdd])];
  if (affectedIds.length > 0) {
    const slugRows = await db
      .select({ slug: collections.slug })
      .from(collections)
      .where(inArray(collections.id, affectedIds));
    for (const { slug } of slugRows) {
      revalidatePath(`/video/collections/${slug}`);
    }
  }
  revalidatePath("/video");
}

export async function createVideo(data: {
  title: string;
  slug: string;
  vimeoId: string;
  r2Url?: string | null;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  description?: string;
  durationSeconds?: number | null;
  collectionIds?: number[];
}) {
  await requireAdmin();

  const title = data.title.trim();
  const slug = data.slug.trim();
  const vimeoId = data.vimeoId.trim();
  if (!title || !slug || !vimeoId) {
    throw new Error("Title, slug, and Vimeo ID are required before saving.");
  }
  if (slug === "collections") {
    throw new Error('"collections" is a reserved slug and cannot be used.');
  }

  const db = getDb();
  const { collectionIds, r2Url, ...rest } = data;
  const r2Norm = r2Url?.trim() ? r2Url.trim() : null;
  const insertData = { ...rest, r2Url: r2Norm };
  const [video] = await db
    .insert(videos)
    .values({ ...insertData, title, slug, vimeoId })
    .returning();
  revalidatePath("/video");
  revalidatePath(`/video/${slug}`);
  if (collectionIds && collectionIds.length > 0) {
    await setVideoCollections({ videoId: video.id, collectionIds });
  }
  redirect(`/admin/videos/${video.id}`);
}

export async function updateVideo(
  id: number,
  data: {
    title?: string;
    slug?: string;
    vimeoId?: string;
    r2Url?: string | null;
    thumbnailUrl?: string;
    thumbnailAlt?: string;
    description?: string;
    durationSeconds?: number | null;
    published?: boolean;
    publishedAt?: Date | null;
    updatedAt: Date;
  }
) {
  await requireAdmin();
  if (data.slug === "collections") {
    throw new Error('"collections" is a reserved slug and cannot be used.');
  }
  const db = getDb();
  const [before] = await db
    .select({ slug: videos.slug })
    .from(videos)
    .where(eq(videos.id, id));
  await db.update(videos).set(data).where(eq(videos.id, id));
  revalidatePath("/video");
  if (before) revalidatePath(`/video/${before.slug}`);
  if (data.slug && data.slug !== before?.slug) {
    revalidatePath(`/video/${data.slug}`);
  }
  const collSlugs = await getCollectionSlugsForVideo(id);
  for (const slug of collSlugs) {
    revalidatePath(`/video/collections/${slug}`);
  }
}

export async function publishVideo(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  const [before] = await db
    .select({ slug: videos.slug })
    .from(videos)
    .where(eq(videos.id, id));
  await db
    .update(videos)
    .set({
      published: publish,
      publishedAt: publish ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(videos.id, id));
  revalidatePath("/video");
  if (before) revalidatePath(`/video/${before.slug}`);
  const collSlugs = await getCollectionSlugsForVideo(id);
  for (const slug of collSlugs) {
    revalidatePath(`/video/collections/${slug}`);
  }
}

export async function deleteVideo(id: number) {
  await requireAdmin();
  const [before] = await (() => {
    const db = getDb();
    return db.select({ slug: videos.slug }).from(videos).where(eq(videos.id, id));
  })();
  const collSlugs = await getCollectionSlugsForVideo(id);
  const db = getDb();
  await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.linkedType, "video"),
        eq(collectionItems.linkedId, id)
      )
    );
  await db.delete(videos).where(eq(videos.id, id));
  revalidatePath("/video");
  if (before) revalidatePath(`/video/${before.slug}`);
  for (const slug of collSlugs) {
    revalidatePath(`/video/collections/${slug}`);
  }
  redirect("/admin/videos");
}
