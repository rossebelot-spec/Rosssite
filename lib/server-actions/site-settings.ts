"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/action-helpers";

export async function upsertSiteSetting(key: string, value: string | null) {
  await requireAdmin();
  const db = getDb();
  await db
    .insert(siteSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    });
  revalidatePath("/work");
  revalidatePath("/admin/settings/works-hub");
}

export async function getSiteSettings(keys: string[]) {
  const db = getDb();
  const rows = await db
    .select()
    .from(siteSettings)
    .where(keys.length === 1 ? eq(siteSettings.key, keys[0]) : inArray(siteSettings.key, keys));
  const map: Record<string, string | null> = {};
  for (const row of rows) {
    map[row.key] = row.value ?? null;
  }
  return map;
}
