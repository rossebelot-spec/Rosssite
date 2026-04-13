import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { opEds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
