"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/action-helpers";

function revalidateBooks() {
  revalidatePath("/literary");
  revalidatePath("/admin/books");
}

export async function createBook(data: {
  title: string;
  subtitle?: string;
  publisher: string;
  year: number;
  description?: string;
  coverImageUrl?: string | null;
  buyUrl?: string | null;
  isbn?: string;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .insert(books)
    .values({
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() ?? "",
      publisher: data.publisher.trim(),
      year: data.year,
      description: data.description?.trim() ?? "",
      coverImageUrl: data.coverImageUrl?.trim() || null,
      buyUrl: data.buyUrl?.trim() || null,
      isbn: data.isbn?.trim() ?? "",
      published: false,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();
  revalidateBooks();
  return row;
}

export async function updateBook(
  id: number,
  data: {
    title?: string;
    subtitle?: string;
    publisher?: string;
    year?: number;
    description?: string;
    coverImageUrl?: string | null;
    buyUrl?: string | null;
    isbn?: string;
    displayOrder?: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(books)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(books.id, id));
  revalidateBooks();
}

export async function publishBook(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(books)
    .set({ published: publish, updatedAt: new Date() })
    .where(eq(books.id, id));
  revalidateBooks();
}

export async function deleteBook(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(books).where(eq(books.id, id));
  revalidateBooks();
}
