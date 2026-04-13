"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { videos, collections, collectionItems } from "@/db/schema";
import { eq, and, asc, sql, inArray } from "drizzle-orm";
import {
  requireAdmin,
  reindexCollectionItemPositions,
} from "@/lib/action-helpers";

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
  await reindexCollectionItemPositions(collectionId);
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
