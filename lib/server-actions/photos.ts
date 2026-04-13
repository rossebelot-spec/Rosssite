"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { photos } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/action-helpers";

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
