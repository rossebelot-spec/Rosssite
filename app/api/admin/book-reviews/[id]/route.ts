import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { bookReviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const [review] = await db
    .select()
    .from(bookReviews)
    .where(eq(bookReviews.id, Number(id)));
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(review);
}
