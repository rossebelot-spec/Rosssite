import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { collections } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select({ id: collections.id, title: collections.title, slug: collections.slug })
    .from(collections)
    .orderBy(asc(collections.displayOrder), asc(collections.title));

  return NextResponse.json(rows);
}
