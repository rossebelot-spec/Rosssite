"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { pressItems, siteEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/action-helpers";

function revalidatePress() {
  revalidatePath("/press");
  revalidatePath("/admin/press");
}

function revalidateEvents() {
  revalidatePath("/events");
  revalidatePath("/admin/events");
}

// ─── Press ─────────────────────────────────────────────────────────────────

export async function createPressItem(data: {
  title: string;
  outlet: string;
  date: string;
  url?: string | null;
  description?: string;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .insert(pressItems)
    .values({
      title: data.title.trim(),
      outlet: data.outlet.trim(),
      date: data.date.trim(),
      url: data.url?.trim() || null,
      description: data.description?.trim() ?? "",
      published: false,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();
  revalidatePress();
  return row;
}

export async function updatePressItem(
  id: number,
  data: {
    title?: string;
    outlet?: string;
    date?: string;
    url?: string | null;
    description?: string;
    displayOrder?: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(pressItems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pressItems.id, id));
  revalidatePress();
}

export async function publishPressItem(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(pressItems)
    .set({ published: publish, updatedAt: new Date() })
    .where(eq(pressItems.id, id));
  revalidatePress();
}

export async function deletePressItem(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(pressItems).where(eq(pressItems.id, id));
  revalidatePress();
}

// ─── Site events ───────────────────────────────────────────────────────────

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
  revalidateEvents();
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
  revalidateEvents();
}

export async function publishSiteEvent(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(siteEvents)
    .set({ published: publish, updatedAt: new Date() })
    .where(eq(siteEvents.id, id));
  revalidateEvents();
}

export async function deleteSiteEvent(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(siteEvents).where(eq(siteEvents.id, id));
  revalidateEvents();
}
