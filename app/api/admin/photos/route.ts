import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { photos } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
