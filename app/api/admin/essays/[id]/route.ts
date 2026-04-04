import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { essays } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const [essay] = await db.select().from(essays).where(eq(essays.id, Number(id)));
  if (!essay) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(essay);
}
