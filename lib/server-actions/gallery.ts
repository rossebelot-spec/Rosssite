"use server";

import { getDb } from "@/db";
import { galleryPhotos, collections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleGalleryPhotoActive(id: number, isActive: boolean) {
  const db = getDb();
  await db
    .update(galleryPhotos)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(galleryPhotos.id, id));
  revalidatePath("/photography/collections");
  revalidatePath("/admin/gallery");
}

export async function setGalleryPhotoFeatured(id: number) {
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
  const db = getDb();
  await db
    .update(galleryPhotos)
    .set({ title: title.trim(), updatedAt: new Date() })
    .where(eq(galleryPhotos.id, id));
  revalidatePath("/admin/gallery");
}

export async function deleteGalleryPhoto(id: number) {
  const db = getDb();
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
  revalidatePath("/photography/collections");
  revalidatePath("/admin/gallery");
}
