import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { opEdCollections } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
