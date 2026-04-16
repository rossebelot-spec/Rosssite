import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { inArray } from "drizzle-orm";

const WORKS_HUB_KEYS = [
  "works_hub_commentary_image",
  "works_hub_essays_image",
  "works_hub_literary_image",
];

export async function GET() {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const db = getDb();
  const rows = await db
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, WORKS_HUB_KEYS));

  const result: Record<string, string | null> = {};
  for (const key of WORKS_HUB_KEYS) {
    result[key] = null;
  }
  for (const row of rows) {
    result[row.key] = row.value ?? null;
  }

  return NextResponse.json(result);
}
