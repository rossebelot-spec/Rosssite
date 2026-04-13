import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { opEdCollections, opEds } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const collId = Number(id);
  const db = getDb();

  const [coll] = await db
    .select()
    .from(opEdCollections)
    .where(eq(opEdCollections.id, collId));
  if (!coll)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const articles = await db
    .select()
    .from(opEds)
    .where(eq(opEds.collectionId, collId))
    .orderBy(asc(opEds.date));

  return NextResponse.json({ ...coll, articles });
}
