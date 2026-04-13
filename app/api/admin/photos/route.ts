import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDb } from "@/db";
import { photos } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await requireApiSession();
    if ("response" in authResult) return authResult.response;

    const db = getDb();
    const allPhotos = await db
      .select()
      .from(photos)
      .orderBy(asc(photos.displayOrder), asc(photos.createdAt));

    return NextResponse.json(allPhotos);
  } catch (err) {
    console.error("[/api/admin/photos]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
