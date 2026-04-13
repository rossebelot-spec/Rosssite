import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDb } from "@/db";
import { opEds, opEdCollections } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await requireApiSession();
    if ("response" in authResult) return authResult.response;

    const db = getDb();
    const all = await db
      .select({
        id: opEds.id,
        collectionId: opEds.collectionId,
        publication: opEds.publication,
        title: opEds.title,
        url: opEds.url,
        date: opEds.date,
        summary: opEds.summary,
        pullQuote: opEds.pullQuote,
        thumbnailUrl: opEds.thumbnailUrl,
        published: opEds.published,
        displayOrder: opEds.displayOrder,
        createdAt: opEds.createdAt,
        collectionPublication: opEdCollections.publication,
      })
      .from(opEds)
      .leftJoin(opEdCollections, eq(opEds.collectionId, opEdCollections.id))
      .orderBy(desc(opEds.date));

    return NextResponse.json(all);
  } catch (err) {
    console.error("[/api/admin/op-eds]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
