"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { onlineReadings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/action-helpers";

function revalidateReadings() {
  revalidatePath("/happenings");
  revalidatePath("/admin/online-readings");
}

export async function createOnlineReading(data: {
  title: string;
  date: string;
  platform?: string;
  externalUrl?: string | null;
  r2Url?: string | null;
  thumbnailUrl?: string;
  description?: string;
  displayOrder?: number;
}) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .insert(onlineReadings)
    .values({
      title: data.title.trim(),
      date: data.date.trim(),
      platform: data.platform?.trim() || "youtube",
      externalUrl: data.externalUrl?.trim() || null,
      r2Url: data.r2Url?.trim() || null,
      thumbnailUrl: data.thumbnailUrl?.trim() ?? "",
      description: data.description?.trim() ?? "",
      published: false,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();
  revalidateReadings();
  return row;
}

export async function updateOnlineReading(
  id: number,
  data: {
    title?: string;
    date?: string;
    platform?: string;
    externalUrl?: string | null;
    r2Url?: string | null;
    thumbnailUrl?: string;
    description?: string;
    displayOrder?: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(onlineReadings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(onlineReadings.id, id));
  revalidateReadings();
}

export async function publishOnlineReading(id: number, publish: boolean) {
  await requireAdmin();
  const db = getDb();
  await db
    .update(onlineReadings)
    .set({ published: publish, updatedAt: new Date() })
    .where(eq(onlineReadings.id, id));
  revalidateReadings();
}

export async function deleteOnlineReading(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(onlineReadings).where(eq(onlineReadings.id, id));
  revalidateReadings();
}
