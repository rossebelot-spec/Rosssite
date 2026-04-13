"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { opEdCollections, opEds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { requireAdmin, isVercelBlobStorageUrl } from "@/lib/action-helpers";

export async function createOpEdCollection(data: {
  publication: string;
  slug: string;
  mastheadUrl?: string | null;
  description?: string;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .insert(opEdCollections)
    .values({
      publication: data.publication,
      slug: data.slug,
      mastheadUrl: data.mastheadUrl ?? null,
      description: data.description ?? "",
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();
  revalidatePath("/op-eds");
  revalidatePath("/admin/op-eds");
  revalidatePath("/admin/op-ed-collections");
  return row;
}

export async function updateOpEdCollection(
  id: number,
  data: {
    publication?: string;
    slug?: string;
    mastheadUrl?: string | null;
    description?: string;
    displayOrder?: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  const [before] = await db
    .select({
      mastheadUrl: opEdCollections.mastheadUrl,
      slug: opEdCollections.slug,
    })
    .from(opEdCollections)
    .where(eq(opEdCollections.id, id));

  if (data.mastheadUrl !== undefined) {
    const prev = before?.mastheadUrl ?? null;
    const next = data.mastheadUrl;
    if (prev && prev !== next && isVercelBlobStorageUrl(prev)) {
      try {
        await del(prev);
      } catch {
        /* ignore */
      }
    }
  }

  await db
    .update(opEdCollections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(opEdCollections.id, id));

  revalidatePath("/op-eds");
  revalidatePath("/admin/op-eds");
  revalidatePath("/admin/op-ed-collections");
  const oldSlug = before?.slug;
  if (data.slug !== undefined && data.slug !== oldSlug && oldSlug) {
    revalidatePath(`/op-eds/${oldSlug}`);
  }
  const [after] = await db
    .select({ slug: opEdCollections.slug })
    .from(opEdCollections)
    .where(eq(opEdCollections.id, id));
  if (after?.slug) revalidatePath(`/op-eds/${after.slug}`);
}

export async function deleteOpEdCollection(id: number) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({
      mastheadUrl: opEdCollections.mastheadUrl,
      slug: opEdCollections.slug,
    })
    .from(opEdCollections)
    .where(eq(opEdCollections.id, id));
  if (row?.mastheadUrl && isVercelBlobStorageUrl(row.mastheadUrl)) {
    try {
      await del(row.mastheadUrl);
    } catch {
      /* ignore */
    }
  }
  if (row?.slug) revalidatePath(`/op-eds/${row.slug}`);
  await db.delete(opEdCollections).where(eq(opEdCollections.id, id));
  revalidatePath("/op-eds");
  revalidatePath("/admin/op-eds");
  revalidatePath("/admin/op-ed-collections");
}

/** Deletes a Vercel Blob object (e.g. abandoned mid-edit upload). Admin-only. */
export async function deleteUploadedBlobUrl(url: string) {
  await requireAdmin();
  if (!isVercelBlobStorageUrl(url)) return;
  try {
    await del(url);
  } catch {
    /* ignore missing or already deleted */
  }
}

export async function createOpEd(data: {
  collectionId?: number | null;
  publication: string;
  title: string;
  url: string;
  date: string;
  summary?: string;
  pullQuote?: string | null;
  thumbnailUrl?: string | null;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .insert(opEds)
    .values({
      collectionId: data.collectionId ?? null,
      publication: data.publication,
      title: data.title,
      url: data.url,
      date: data.date,
      summary: data.summary ?? "",
      pullQuote: data.pullQuote ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      published: false,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();
  revalidatePath("/");
  revalidatePath("/op-eds");
  revalidatePath("/admin/op-eds");
  return row;
}

export async function publishOpEd(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ collectionId: opEds.collectionId })
    .from(opEds)
    .where(eq(opEds.id, id));
  await db
    .update(opEds)
    .set({ published: publish, updatedAt: new Date() })
    .where(eq(opEds.id, id));
  revalidatePath("/");
  revalidatePath("/op-eds");
  revalidatePath("/admin/op-eds");
  if (row?.collectionId != null) {
    const [coll] = await db
      .select({ slug: opEdCollections.slug })
      .from(opEdCollections)
      .where(eq(opEdCollections.id, row.collectionId));
    if (coll?.slug) revalidatePath(`/op-eds/${coll.slug}`);
  }
}

export async function updateOpEd(
  id: number,
  data: {
    collectionId?: number | null;
    publication?: string;
    title?: string;
    url?: string;
    date?: string;
    summary?: string;
    pullQuote?: string | null;
    thumbnailUrl?: string | null;
    displayOrder?: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  const [before] = await db
    .select({ thumbnailUrl: opEds.thumbnailUrl })
    .from(opEds)
    .where(eq(opEds.id, id));

  if (data.thumbnailUrl !== undefined) {
    const prev = before?.thumbnailUrl ?? null;
    const next = data.thumbnailUrl;
    if (prev && prev !== next && isVercelBlobStorageUrl(prev)) {
      try {
        await del(prev);
      } catch {
        /* ignore missing or already deleted blob */
      }
    }
  }

  await db
    .update(opEds)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(opEds.id, id));
  revalidatePath("/");
  revalidatePath("/op-eds");
  revalidatePath("/admin/op-eds");
  const [afterMeta] = await db
    .select({ collectionId: opEds.collectionId })
    .from(opEds)
    .where(eq(opEds.id, id));
  if (afterMeta?.collectionId != null) {
    const [coll] = await db
      .select({ slug: opEdCollections.slug })
      .from(opEdCollections)
      .where(eq(opEdCollections.id, afterMeta.collectionId));
    if (coll?.slug) revalidatePath(`/op-eds/${coll.slug}`);
  }
}

export async function deleteOpEd(id: number) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({
      thumbnailUrl: opEds.thumbnailUrl,
      collectionId: opEds.collectionId,
    })
    .from(opEds)
    .where(eq(opEds.id, id));
  if (row?.thumbnailUrl && isVercelBlobStorageUrl(row.thumbnailUrl)) {
    try {
      await del(row.thumbnailUrl);
    } catch {
      /* ignore */
    }
  }
  if (row?.collectionId != null) {
    const [coll] = await db
      .select({ slug: opEdCollections.slug })
      .from(opEdCollections)
      .where(eq(opEdCollections.id, row.collectionId));
    if (coll?.slug) revalidatePath(`/op-eds/${coll.slug}`);
  }
  await db.delete(opEds).where(eq(opEds.id, id));
  revalidatePath("/");
  revalidatePath("/op-eds");
  revalidatePath("/admin/op-eds");
}
