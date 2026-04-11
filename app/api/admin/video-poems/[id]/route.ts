import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { videoPoems, contentLinks, content } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const poemId = Number(id);
  const db = getDb();
  const [poem] = await db
    .select()
    .from(videoPoems)
    .where(eq(videoPoems.id, poemId));
  if (!poem)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [linkedEssay] = await db
    .select({
      linkId: contentLinks.id,
      contentId: content.id,
      title: content.title,
      type: content.type,
    })
    .from(contentLinks)
    .innerJoin(content, eq(content.id, contentLinks.contentId))
    .where(eq(contentLinks.videoPoemId, poemId))
    .limit(1);

  return NextResponse.json({
    ...poem,
    linkedEssay: linkedEssay ?? null,
  });
}
