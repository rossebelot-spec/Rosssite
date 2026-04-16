"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { literaryPublications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/action-helpers";

function revalidateLiteraryPublications() {
  revalidatePath("/literary");
  revalidatePath("/admin/literary-publications");
}

export async function createLiteraryPublication(data: {
  title: string;
  publication: string;
  date: string;
  kind?: string;
  url?: string | null;
  description?: string;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .insert(literaryPublications)
    .values({
      title: data.title.trim(),
      publication: data.publication.trim(),
      date: data.date.trim(),
      kind: data.kind?.trim() || "journal",
      url: data.url?.trim() || null,
      description: data.description?.trim() ?? "",
      published: false,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();
  revalidateLiteraryPublications();
  return row;
}

export async function updateLiteraryPublication(
  id: number,
  data: {
    title?: string;
    publication?: string;
    date?: string;
    kind?: string;
    url?: string | null;
    description?: string;
    displayOrder?: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(literaryPublications)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(literaryPublications.id, id));
  revalidateLiteraryPublications();
}

export async function publishLiteraryPublication(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(literaryPublications)
    .set({ published: publish, updatedAt: new Date() })
    .where(eq(literaryPublications.id, id));
  revalidateLiteraryPublications();
}

export async function deleteLiteraryPublication(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(literaryPublications).where(eq(literaryPublications.id, id));
  revalidateLiteraryPublications();
}
