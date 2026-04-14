"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { newsItems, siteEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/action-helpers";

function revalidateNews() {
  revalidatePath("/news");
  revalidatePath("/happenings");
  revalidatePath("/");
  revalidatePath("/admin/news");
}

function revalidateSiteEvents() {
  revalidatePath("/events");
  revalidatePath("/happenings");
  revalidatePath("/about/events");
  revalidatePath("/admin/events");
}

// ─── News items (coverage, announcements, on-site stories) ─────────────────

export async function createNewsItem(data: {
  title: string;
  kind?: string;
  outlet?: string;
  date: string;
  url?: string | null;
  description?: string;
  bodyHtml?: string;
  slug?: string | null;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  const kind = data.kind?.trim() || "coverage";
  const [row] = await db
    .insert(newsItems)
    .values({
      kind,
      title: data.title.trim(),
      outlet: data.outlet?.trim() ?? "",
      date: data.date.trim(),
      url: data.url?.trim() || null,
      description: data.description?.trim() ?? "",
      bodyHtml: data.bodyHtml?.trim() ?? "",
      slug: data.slug?.trim() || null,
      published: false,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();
  revalidateNews();
  return row;
}

export async function updateNewsItem(
  id: number,
  data: {
    title?: string;
    kind?: string;
    outlet?: string;
    date?: string;
    url?: string | null;
    description?: string;
    bodyHtml?: string;
    slug?: string | null;
    displayOrder?: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(newsItems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(newsItems.id, id));
  revalidateNews();
}

export async function publishNewsItem(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(newsItems)
    .set({ published: publish, updatedAt: new Date() })
    .where(eq(newsItems.id, id));
  revalidateNews();
}

export async function deleteNewsItem(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(newsItems).where(eq(newsItems.id, id));
  revalidateNews();
}

// ─── Site events (public `/events` + Happenings tab) ─────────────────────────

export async function createSiteEvent(data: {
  title: string;
  date: string;
  location: string;
  description?: string;
  link?: string | null;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .insert(siteEvents)
    .values({
      title: data.title.trim(),
      date: data.date.trim(),
      location: data.location.trim(),
      description: data.description?.trim() ?? "",
      link: data.link?.trim() || null,
      published: false,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();
  revalidateSiteEvents();
  return row;
}

export async function updateSiteEvent(
  id: number,
  data: {
    title?: string;
    date?: string;
    location?: string;
    description?: string;
    link?: string | null;
    displayOrder?: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(siteEvents)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(siteEvents.id, id));
  revalidateSiteEvents();
}

export async function publishSiteEvent(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(siteEvents)
    .set({ published: publish, updatedAt: new Date() })
    .where(eq(siteEvents.id, id));
  revalidateSiteEvents();
}

export async function deleteSiteEvent(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(siteEvents).where(eq(siteEvents.id, id));
  revalidateSiteEvents();
}
