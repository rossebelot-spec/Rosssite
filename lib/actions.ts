"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { essays, bookReviews, photos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { del } from "@vercel/blob";

// ─── Auth guard ────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");
}

// ─── Essays ────────────────────────────────────────────────────────────────

export async function createEssay(data: {
  title: string;
  slug: string;
  bodyHtml: string;
  description: string;
  tags: string[];
  published: boolean;
  publishedAt?: Date | null;
}) {
  await requireAdmin();
  const db = getDb();
  const [essay] = await db.insert(essays).values(data).returning();
  revalidatePath("/essays");
  redirect(`/admin/essays/${essay.id}`);
}

export async function updateEssay(
  id: number,
  data: {
    title?: string;
    slug?: string;
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
  await db.update(essays).set(data).where(eq(essays.id, id));
  revalidatePath("/essays");
  revalidatePath(`/essays/${data.slug ?? ""}`);
}

export async function deleteEssay(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(essays).where(eq(essays.id, id));
  revalidatePath("/essays");
  redirect("/admin/essays");
}

// ─── Book Reviews ──────────────────────────────────────────────────────────

export async function createBookReview(data: {
  title: string;
  slug: string;
  author: string;
  bodyHtml: string;
  description: string;
  rating?: number | null;
  published: boolean;
  publishedAt?: Date | null;
}) {
  await requireAdmin();
  const db = getDb();
  const [review] = await db.insert(bookReviews).values(data).returning();
  revalidatePath("/book-reviews");
  redirect(`/admin/book-reviews/${review.id}`);
}

export async function updateBookReview(
  id: number,
  data: {
    title?: string;
    slug?: string;
    author?: string;
    bodyHtml?: string;
    description?: string;
    rating?: number | null;
    published?: boolean;
    publishedAt?: Date | null;
    updatedAt: Date;
  }
) {
  await requireAdmin();
  const db = getDb();
  await db.update(bookReviews).set(data).where(eq(bookReviews.id, id));
  revalidatePath("/book-reviews");
  revalidatePath(`/book-reviews/${data.slug ?? ""}`);
}

export async function deleteBookReview(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(bookReviews).where(eq(bookReviews.id, id));
  revalidatePath("/book-reviews");
  redirect("/admin/book-reviews");
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

export async function deletePhoto(id: number, blobUrl: string) {
  await requireAdmin();
  await del(blobUrl);
  const db = getDb();
  await db.delete(photos).where(eq(photos.id, id));
  revalidatePath("/photography");
}
