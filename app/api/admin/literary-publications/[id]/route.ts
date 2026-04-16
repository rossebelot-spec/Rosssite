import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDb } from "@/db";
import { literaryPublications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select()
    .from(literaryPublications)
    .where(eq(literaryPublications.id, Number(id)));

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}
