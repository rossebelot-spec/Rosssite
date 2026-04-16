"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { photos, collections, collectionItems } from "@/db/schema";
import { eq, ne, and, asc, sql } from "drizzle-orm";
import { del } from "@vercel/blob";
import { requireAdmin, reindexCollectionItemPositions } from "@/lib/action-helpers";

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

// ─── Photo collections ────────────────────────────────────────────────────────

export async function getPhotoCollections(): Promise<
  { id: number; title: string; slug: string }[]
> {
  await requireAdmin();
  const db = getDb();
  return db
    .select({ id: collections.id, title: collections.title, slug: collections.slug })
    .from(collections)
    .where(eq(collections.mediaType, "photo"))
    .orderBy(asc(collections.title));
}

export async function addPhotoToCollection(photoId: number, collectionId: number) {
  await requireAdmin();
  const db = getDb();
  const [maxRow] = await db
    .select({ maxPos: sql<number>`coalesce(max(${collectionItems.position}), -1)` })
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, collectionId));
  await db
    .insert(collectionItems)
    .values({
      collectionId,
      linkedType: "photo",
      linkedId: photoId,
      position: (maxRow?.maxPos ?? -1) + 1,
    })
    .onConflictDoNothing();
  const [coll] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, collectionId));
  if (coll) revalidatePath(`/photography/collections/${coll.slug}`);
  revalidatePath("/multimedia");
}

export async function removePhotoFromCollection(photoId: number, collectionId: number) {
  await requireAdmin();
  const db = getDb();
  await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.linkedType, "photo"),
        eq(collectionItems.linkedId, photoId)
      )
    );
  await reindexCollectionItemPositions(collectionId);
  const [coll] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, collectionId));
  if (coll) revalidatePath(`/photography/collections/${coll.slug}`);
  revalidatePath("/multimedia");
}

export async function movePhotoInCollection(
  photoId: number,
  collectionId: number,
  direction: "up" | "down"
) {
  await requireAdmin();
  const db = getDb();

  // Get all items in this collection ordered by position
  const items = await db
    .select({ id: collectionItems.id, linkedId: collectionItems.linkedId, position: collectionItems.position })
    .from(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.linkedType, "photo")
      )
    )
    .orderBy(asc(collectionItems.position));

  const idx = items.findIndex((item) => item.linkedId === photoId);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) return;

  // Swap positions
  const a = items[idx];
  const b = items[swapIdx];
  await db.update(collectionItems).set({ position: b.position }).where(eq(collectionItems.id, a.id));
  await db.update(collectionItems).set({ position: a.position }).where(eq(collectionItems.id, b.id));

  const [coll] = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.id, collectionId));
  if (coll) revalidatePath(`/photography/collections/${coll.slug}`);
}

export async function createPhotoCollectionWithFirstPhoto(
  photoId: number,
  title: string
): Promise<{ id: number; title: string; slug: string }> {
  await requireAdmin();
  const db = getDb();

  // Auto-generate a unique slug from title
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "photos";
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
    .values({ title: title.trim(), slug, mediaType: "photo", published: false, displayOrder: 0 })
    .returning();

  await db.insert(collectionItems).values({
    collectionId: collection.id,
    linkedType: "photo",
    linkedId: photoId,
    position: 0,
  });

  revalidatePath("/multimedia");
  return { id: collection.id, title: collection.title, slug: collection.slug };
}
