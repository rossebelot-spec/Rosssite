"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  photos,
  videos,
  collections,
  collectionItems,
  content,
  contentLinks,
  type ContentType,
} from "@/db/schema";
import { eq, ne, and, asc, sql, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { del } from "@vercel/blob";

// ─── Auth guard ────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");
}

// ─── Content (unified: essay | blog | review | news | event) ──────────────

function contentPrimaryPaths(type: string, slug: string): string[] {
  if (type === "essay" || type === "blog") {
    return ["/essays", `/essays/${slug}`];
  }
  if (type === "review") {
    return ["/book-reviews", `/book-reviews/${slug}`];
  }
  return [];
}

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
  pendingLink?: { videoId?: number; collectionId?: number };
}) {
  await requireAdmin();
  const db = getDb();
  const { pendingLink, ...insertData } = data;
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
    updatedAt: Date;
  }
) {
  await requireAdmin();
  const db = getDb();
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

  // Revalidate canonical video pages and collection pages for any linked videos
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
  await db.delete(content).where(eq(content.id, id));
  revalidatePath("/essays");
  revalidatePath("/book-reviews");
  redirect("/admin/content");
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

// ─── Photos ────────────────────────────────────────────────────────────────

export async function createPhoto(data: {
  blobUrl: string;
  caption: string;
  alt: string;
  takenAt?: Date | null;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  await db.insert(photos).values(data);
  revalidatePath("/photography");
}

export async function updatePhoto(
  id: number,
  data: {
    caption?: string;
    alt?: string;
    takenAt?: Date | null;
    displayOrder?: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  await db.update(photos).set(data).where(eq(photos.id, id));
  revalidatePath("/photography");
}

export async function setHeroPhoto(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.update(photos).set({ isHero: false }).where(ne(photos.id, id));
  await db.update(photos).set({ isHero: true }).where(eq(photos.id, id));
  revalidatePath("/");
  revalidatePath("/photography");
}

export async function deletePhoto(id: number, blobUrl: string) {
  await requireAdmin();
  await del(blobUrl);
  const db = getDb();
  await db.delete(photos).where(eq(photos.id, id));
  revalidatePath("/photography");
}

// ─── Internal helpers ───────────────────────────────────────────────────────

async function getCollectionSlugsForVideo(videoId: number): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ slug: collections.slug })
    .from(collectionItems)
    .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
    .where(
      and(
        eq(collectionItems.linkedType, "video"),
        eq(collectionItems.linkedId, videoId)
      )
    );
  return rows.map((r) => r.slug);
}

// ─── Videos ─────────────────────────────────────────────────────────────────

export async function createVideo(data: {
  title: string;
  slug: string;
  vimeoId: string;
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
  const { collectionIds, ...insertData } = data;
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
  // Fetch old slug before update so we can revalidate the old canonical URL
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
  // No FK cascade on linkedId — delete orphaned collection_items explicitly
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

// ─── Collections ────────────────────────────────────────────────────────────

export async function createCollection(data: {
  title: string;
  slug: string;
  description?: string;
  introHtml?: string;
  coverImageUrl?: string | null;
  published: boolean;
  publishedAt?: Date | null;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  const [collection] = await db.insert(collections).values(data).returning();
  revalidatePath("/video");
  redirect(`/admin/collections/${collection.id}`);
}

/** Empty collection for admin pickers when the video row does not exist yet; link rows are added when the video is saved. */
export async function createCollectionForPicker(data: {
  title: string;
  slug: string;
}): Promise<{ id: number; title: string; slug: string }> {
  await requireAdmin();
  const db = getDb();
  const base = data.slug.trim() || "collection";
  let slug = base;
  let n = 0;
  while (true) {
    const [existing] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    if (!existing) break;
    n += 1;
    slug = `${base}-${n}`;
  }
  const [collection] = await db
    .insert(collections)
    .values({
      title: data.title.trim(),
      slug,
      description: "",
      introHtml: "",
      published: false,
      displayOrder: 0,
    })
    .returning();
  revalidatePath("/video");
  return { id: collection.id, title: collection.title, slug: collection.slug };
}

export async function publishCollection(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(collections)
    .set({
      published: publish,
      publishedAt: publish ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(collections.id, id));

  if (!publish) {
    // Cascade unpublish to all videos in this collection
    const members = await db
      .select({ linkedId: collectionItems.linkedId })
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, id),
          eq(collectionItems.linkedType, "video")
        )
      );
    if (members.length > 0) {
      const videoIds = members.map((r) => r.linkedId);
      await db
        .update(videos)
        .set({ published: false, publishedAt: null, updatedAt: new Date() })
        .where(inArray(videos.id, videoIds));
      // Revalidate canonical pages for each unpublished video
      const videoRows = await db
        .select({ slug: videos.slug })
        .from(videos)
        .where(inArray(videos.id, videoIds));
      for (const { slug } of videoRows) {
        revalidatePath(`/video/${slug}`);
      }
    }
  }

  const [current] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, id));
  revalidatePath("/video");
  if (current) {
    revalidatePath(`/video/collections/${current.slug}`);
  }
}

export async function updateCollection(
  id: number,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    introHtml?: string;
    coverImageUrl?: string | null;
    published?: boolean;
    publishedAt?: Date | null;
    displayOrder?: number;
    updatedAt: Date;
  }
) {
  await requireAdmin();
  const db = getDb();
  const [current] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, id));
  await db.update(collections).set(data).where(eq(collections.id, id));
  revalidatePath("/video");
  if (current) {
    revalidatePath(`/video/collections/${current.slug}`);
  }
  if (data.slug && data.slug !== current?.slug) {
    revalidatePath(`/video/collections/${data.slug}`);
  }
}

export async function deleteCollection(id: number) {
  await requireAdmin();
  const db = getDb();
  const [current] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, id));
  await db.delete(collections).where(eq(collections.id, id));
  revalidatePath("/video");
  if (current) {
    revalidatePath(`/video/collections/${current.slug}`);
  }
  redirect("/admin/collections");
}

export async function addVideoToCollection({
  collectionId,
  videoId,
}: {
  collectionId: number;
  videoId: number;
}) {
  await requireAdmin();
  const db = getDb();
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
  const [coll] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, collectionId));
  if (coll) {
    revalidatePath(`/video/collections/${coll.slug}`);
  }
}

export async function removeVideoFromCollection({
  collectionId,
  videoId,
}: {
  collectionId: number;
  videoId: number;
}) {
  await requireAdmin();
  const db = getDb();
  await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.linkedType, "video"),
        eq(collectionItems.linkedId, videoId)
      )
    );
  const remaining = await db
    .select({ id: collectionItems.id })
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, collectionId))
    .orderBy(asc(collectionItems.position));
  for (let i = 0; i < remaining.length; i++) {
    await db
      .update(collectionItems)
      .set({ position: i })
      .where(eq(collectionItems.id, remaining[i].id));
  }
  const [coll] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, collectionId));
  if (coll) {
    revalidatePath(`/video/collections/${coll.slug}`);
  }
}

export async function reorderCollectionItems({
  collectionId,
  orderedVideoIds,
}: {
  collectionId: number;
  orderedVideoIds: number[];
}) {
  await requireAdmin();
  const db = getDb();
  await Promise.all(
    orderedVideoIds.map((videoId, i) =>
      db
        .update(collectionItems)
        .set({ position: i })
        .where(
          and(
            eq(collectionItems.collectionId, collectionId),
            eq(collectionItems.linkedType, "video"),
            eq(collectionItems.linkedId, videoId)
          )
        )
    )
  );
  const [coll] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, collectionId));
  if (coll) {
    revalidatePath(`/video/collections/${coll.slug}`);
  }
}

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
    const remaining = await db
      .select({ id: collectionItems.id })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId))
      .orderBy(asc(collectionItems.position));
    for (let i = 0; i < remaining.length; i++) {
      await db
        .update(collectionItems)
        .set({ position: i })
        .where(eq(collectionItems.id, remaining[i].id));
    }
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

export async function createCollectionWithFirstItem({
  title,
  slug,
  linkedType,
  linkedId,
}: {
  title: string;
  slug: string;
  linkedType: string;
  linkedId: number;
}): Promise<{ id: number; title: string; slug: string }> {
  await requireAdmin();
  const db = getDb();

  const [collection] = await db
    .insert(collections)
    .values({ title, slug, published: false, displayOrder: 0 })
    .returning();

  await db.insert(collectionItems).values({
    collectionId: collection.id,
    linkedType,
    linkedId,
    position: 0,
  });

  revalidatePath("/video");
  return { id: collection.id, title: collection.title, slug: collection.slug };
}
