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
import { requireHostedVideoUrl } from "@/lib/hosted-video-url";

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
  r2Url: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  description?: string;
  durationSeconds?: number | null;
  collectionIds?: number[];
}) {
  await requireAdmin();

  const title = data.title.trim();
  const slug = data.slug.trim();
  if (!title || !slug) {
    throw new Error("Title and slug are required before saving.");
  }
  if (slug === "collections") {
    throw new Error('"collections" is a reserved slug and cannot be used.');
  }

  const r2Norm = requireHostedVideoUrl(data.r2Url);

  const db = getDb();
  const { collectionIds, r2Url: _, ...rest } = data;
  const insertData = { ...rest, r2Url: r2Norm };
  const [video] = await db
    .insert(videos)
    .values({ ...insertData, title, slug })
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
  const payload: typeof data = { ...data };
  if (payload.r2Url !== undefined) {
    if (payload.r2Url === null || String(payload.r2Url).trim() === "") {
      throw new Error("Hosted video URL cannot be empty.");
    }
    payload.r2Url = requireHostedVideoUrl(payload.r2Url);
  }
  const db = getDb();
  const [before] = await db
    .select({ slug: videos.slug })
    .from(videos)
    .where(eq(videos.id, id));
  await db.update(videos).set(payload).where(eq(videos.id, id));
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
    .select({
      slug: videos.slug,
      featured: videos.isFeaturedForHome,
      r2Url: videos.r2Url,
    })
    .from(videos)
    .where(eq(videos.id, id));
  if (publish && before && !(before.r2Url ?? "").trim()) {
    throw new Error("Set a hosted video URL (HTTPS MP4) before publishing.");
  }
  await db
    .update(videos)
    .set({
      published: publish,
      publishedAt: publish ? new Date() : null,
      updatedAt: new Date(),
      ...(!publish ? { isFeaturedForHome: false } : {}),
    })
    .where(eq(videos.id, id));
  revalidatePath("/video");
  if (before) revalidatePath(`/video/${before.slug}`);
  if (!publish && before?.featured) {
    revalidatePath("/");
  }
  const collSlugs = await getCollectionSlugsForVideo(id);
  for (const slug of collSlugs) {
    revalidatePath(`/video/collections/${slug}`);
  }
}

/** Feature this video on `/` (hero + grid). Clears any other featured row. Requires published. */
export async function setFeaturedHomeVideo(videoId: number) {
  await requireAdmin();
  const db = getDb();
  const [target] = await db
    .select({
      id: videos.id,
      slug: videos.slug,
      published: videos.published,
    })
    .from(videos)
    .where(eq(videos.id, videoId));
  if (!target) throw new Error("Video not found.");
  if (!target.published) {
    throw new Error("Publish the video before featuring it on the home page.");
  }

  const [previous] = await db
    .select({ slug: videos.slug })
    .from(videos)
    .where(eq(videos.isFeaturedForHome, true))
    .limit(1);

  await db.update(videos).set({ isFeaturedForHome: false });
  await db
    .update(videos)
    .set({ isFeaturedForHome: true, updatedAt: new Date() })
    .where(eq(videos.id, videoId));

  revalidatePath("/");
  revalidatePath("/video");
  if (previous && previous.slug !== target.slug) {
    revalidatePath(`/video/${previous.slug}`);
  }
  revalidatePath(`/video/${target.slug}`);
}

export async function clearFeaturedHomeVideo(videoId: number) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ slug: videos.slug })
    .from(videos)
    .where(and(eq(videos.id, videoId), eq(videos.isFeaturedForHome, true)));
  if (!row) return;

  await db
    .update(videos)
    .set({ isFeaturedForHome: false, updatedAt: new Date() })
    .where(eq(videos.id, videoId));

  revalidatePath("/");
  revalidatePath("/video");
  revalidatePath(`/video/${row.slug}`);
}

export async function deleteVideo(id: number) {
  await requireAdmin();
  const [before] = await (() => {
    const db = getDb();
    return db
      .select({ slug: videos.slug, featured: videos.isFeaturedForHome })
      .from(videos)
      .where(eq(videos.id, id));
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
  if (before?.featured) revalidatePath("/");
  if (before) revalidatePath(`/video/${before.slug}`);
  for (const slug of collSlugs) {
    revalidatePath(`/video/collections/${slug}`);
  }
  redirect("/admin/videos");
}
