import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { requireApiSession } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const db = getDb();

  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(collections)
      .orderBy(asc(collections.displayOrder)),
    db
      .select({
        collectionId: collectionItems.collectionId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(collectionItems)
      .groupBy(collectionItems.collectionId),
  ]);

  const countMap = new Map(counts.map((c) => [c.collectionId, c.count]));

  return NextResponse.json(
    rows.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      mediaType: c.mediaType,
      displayOrder: c.displayOrder,
      published: c.published,
      itemCount: countMap.get(c.id) ?? 0,
    }))
  );
}
