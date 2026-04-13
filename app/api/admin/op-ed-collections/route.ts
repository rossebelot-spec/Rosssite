import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDb } from "@/db";
import { opEdCollections } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await requireApiSession();
    if ("response" in authResult) return authResult.response;

    const db = getDb();
    const all = await db
      .select()
      .from(opEdCollections)
      .orderBy(asc(opEdCollections.displayOrder), asc(opEdCollections.id));

    return NextResponse.json(all);
  } catch (err) {
    console.error("[/api/admin/op-ed-collections]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
