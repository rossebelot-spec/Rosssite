import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { galleryPhotos } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const photos = await db
      .select()
      .from(galleryPhotos)
      .orderBy(desc(galleryPhotos.interestingnessScore));
    return NextResponse.json(photos);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load gallery" },
      { status: 500 }
    );
  }
}
