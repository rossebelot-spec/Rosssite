"use server";

import { getDb } from "@/db";
import { galleryPhotos, collections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/action-helpers";

export async function toggleGalleryPhotoActive(id: number, isActive: boolean) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(galleryPhotos)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(galleryPhotos.id, id));
  revalidatePath("/photography/collections");
  revalidatePath("/admin/gallery");
}

export async function setGalleryPhotoFeatured(id: number) {
  await requireAdmin();
  const db = getDb();
  // Unset any existing featured photo first
  await db
    .update(galleryPhotos)
    .set({ isFeatured: false, updatedAt: new Date() })
    .where(eq(galleryPhotos.isFeatured, true));
  // Set the new one and get its URL
  await db
    .update(galleryPhotos)
    .set({ isFeatured: true, updatedAt: new Date() })
    .where(eq(galleryPhotos.id, id));

  const [photo] = await db
    .select({ r2Url: galleryPhotos.r2Url })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.id, id));

  // Sync the cover image on all photo collections so the multimedia listing stays current
  if (photo?.r2Url) {
    await db
      .update(collections)
      .set({ coverImageUrl: photo.r2Url, updatedAt: new Date() })
      .where(eq(collections.mediaType, "photo"));
  }

  revalidatePath("/photography/collections");
  revalidatePath("/multimedia");
  revalidatePath("/admin/gallery");
}

export async function updateGalleryPhotoTitle(id: number, title: string) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(galleryPhotos)
    .set({ title: title.trim(), updatedAt: new Date() })
    .where(eq(galleryPhotos.id, id));
  revalidatePath("/admin/gallery");
}

export async function deleteGalleryPhoto(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
  revalidatePath("/photography/collections");
  revalidatePath("/admin/gallery");
}

export async function registerGalleryPhoto(data: {
  r2Url: string;
  title?: string;
  sourceId?: string;
  width?: number | null;
  height?: number | null;
}) {
  await requireAdmin();
  const db = getDb();
  const sourceId = data.sourceId ?? data.r2Url.split("/").pop() ?? data.r2Url;
  const [row] = await db
    .insert(galleryPhotos)
    .values({
      r2Url: data.r2Url.trim(),
      title: data.title?.trim() ?? "",
      sourceId,
      source: "manual",
      width: data.width ?? null,
      height: data.height ?? null,
      isActive: true,
      isFeatured: false,
      interestingnessScore: 0,
      views: 0,
      faves: 0,
    })
    .returning();
  revalidatePath("/photography/collections");
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  return row;
}

export async function registerGalleryPhotoBatch(
  photos: Array<{
    r2Url: string;
    title?: string;
    sourceId?: string;
    width?: number | null;
    height?: number | null;
  }>
) {
  await requireAdmin();
  const db = getDb();
  const values = photos.map((data) => ({
    r2Url: data.r2Url.trim(),
    title: data.title?.trim() ?? "",
    sourceId: data.sourceId ?? data.r2Url.split("/").pop() ?? data.r2Url,
    source: "manual" as const,
    width: data.width ?? null,
    height: data.height ?? null,
    isActive: true,
    isFeatured: false,
    interestingnessScore: 0,
    views: 0,
    faves: 0,
  }));
  const rows = await db.insert(galleryPhotos).values(values).returning();
  revalidatePath("/photography/collections");
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  return rows;
}
