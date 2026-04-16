import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { collections } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireApiSession } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const db = getDb();
  const rows = await db
    .select({ id: collections.id, title: collections.title, slug: collections.slug })
    .from(collections)
    .where(eq(collections.mediaType, "photo"))
    .orderBy(asc(collections.title));

  return NextResponse.json(rows);
}
