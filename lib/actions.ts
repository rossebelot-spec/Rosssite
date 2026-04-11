"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  photos,
  videoPoems,
  collections,
  collectionItems,
  content,
  contentLinks,
  type ContentType,
} from "@/db/schema";
import { eq, ne, and, asc, sql } from "drizzle-orm";
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
  pendingLink?: { videoPoemId?: number; collectionId?: number };
}) {
  await requireAdmin();
  const db = getDb();
  const { pendingLink, ...insertData } = data;
  const [row] = await db.insert(content).values(insertData).returning();

  if (pendingLink && (pendingLink.videoPoemId || pendingLink.collectionId)) {
    await db.insert(contentLinks).values({
      contentId: row.id,
      videoPoemId: pendingLink.videoPoemId ?? null,
      collectionId: pendingLink.collectionId ?? null,
    });
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

  // Load the current row to determine type + slug for revalidation
  const [row] = await db
    .select({ type: content.type, slug: content.slug })
    .from(content)
    .where(eq(content.id, id));
  if (row) {
    for (const path of contentPrimaryPaths(row.type, row.slug)) {
      revalidatePath(path);
    }
  }

  // Revalidate collection pages for any linked video poems
  const linkedPoems = await db
    .select({ videoPoemId: contentLinks.videoPoemId })
    .from(contentLinks)
    .where(eq(contentLinks.contentId, id));
  for (const { videoPoemId } of linkedPoems) {
    if (videoPoemId == null) continue;
    const slugs = await getCollectionSlugsContainingPoem(videoPoemId);
    for (const slug of slugs) {
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
  videoPoemId,
  collectionId,
}: {
  contentId: number;
  videoPoemId?: number;
  collectionId?: number;
}) {
  await requireAdmin();
  const db = getDb();
  await db.insert(contentLinks).values({
    contentId,
    videoPoemId: videoPoemId ?? null,
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

  if (videoPoemId) {
    const slugs = await getCollectionSlugsContainingPoem(videoPoemId);
    for (const slug of slugs) {
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

  if (link.videoPoemId) {
    const slugs = await getCollectionSlugsContainingPoem(link.videoPoemId);
    for (const slug of slugs) {
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
  // Clear any existing hero, then set the new one
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

async function getCollectionSlugsContainingPoem(
  poemId: number
): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ slug: collections.slug })
    .from(collectionItems)
    .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
    .where(eq(collectionItems.videoPoemId, poemId));
  return rows.map((r) => r.slug);
}

// ─── Video Poems ────────────────────────────────────────────────────────────

export async function createVideoPoem(data: {
  title: string;
  slug: string;
  vimeoId: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  description?: string;
  durationSeconds?: number | null;
}) {
  await requireAdmin();
  const db = getDb();
  const [poem] = await db.insert(videoPoems).values(data).returning();
  revalidatePath("/video");
  redirect(`/admin/video-poems/${poem.id}`);
}

export async function updateVideoPoem(
  id: number,
  data: {
    title?: string;
    slug?: string;
    vimeoId?: string;
    thumbnailUrl?: string;
    thumbnailAlt?: string;
    description?: string;
    durationSeconds?: number | null;
    updatedAt: Date;
  }
) {
  await requireAdmin();
  const db = getDb();
  await db.update(videoPoems).set(data).where(eq(videoPoems.id, id));
  revalidatePath("/video");
  const slugs = await getCollectionSlugsContainingPoem(id);
  for (const slug of slugs) {
    revalidatePath(`/video/collections/${slug}`);
  }
}

export async function deleteVideoPoem(id: number) {
  await requireAdmin();
  const slugs = await getCollectionSlugsContainingPoem(id);
  const db = getDb();
  await db.delete(videoPoems).where(eq(videoPoems.id, id));
  revalidatePath("/video");
  for (const slug of slugs) {
    revalidatePath(`/video/collections/${slug}`);
  }
  redirect("/admin/video-poems");
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
  const [collection] = await db
    .insert(collections)
    .values(data)
    .returning();
  revalidatePath("/video");
  redirect(`/admin/collections/${collection.id}`);
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

export async function addVideoPoemToCollection({
  collectionId,
  videoPoemId,
}: {
  collectionId: number;
  videoPoemId: number;
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
    videoPoemId,
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

export async function removeVideoPoemFromCollection({
  collectionId,
  videoPoemId,
}: {
  collectionId: number;
  videoPoemId: number;
}) {
  await requireAdmin();
  const db = getDb();
  await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.videoPoemId, videoPoemId)
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
  orderedVideoPoemIds,
}: {
  collectionId: number;
  orderedVideoPoemIds: number[];
}) {
  await requireAdmin();
  const db = getDb();
  await Promise.all(
    orderedVideoPoemIds.map((videoPoemId, i) =>
      db
        .update(collectionItems)
        .set({ position: i })
        .where(
          and(
            eq(collectionItems.collectionId, collectionId),
            eq(collectionItems.videoPoemId, videoPoemId)
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
