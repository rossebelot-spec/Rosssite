import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getDb } from "@/db";
import { opEds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const { id } = await params;
  const db = getDb();

  const [article] = await db
    .select()
    .from(opEds)
    .where(eq(opEds.id, Number(id)));

  if (!article)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(article);
}
