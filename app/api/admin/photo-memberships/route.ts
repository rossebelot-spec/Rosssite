import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { collectionItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireApiSession } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const db = getDb();
  const rows = await db
    .select({
      photoId: collectionItems.linkedId,
      collectionId: collectionItems.collectionId,
      position: collectionItems.position,
    })
    .from(collectionItems)
    .where(eq(collectionItems.linkedType, "photo"));

  return NextResponse.json(rows);
}
