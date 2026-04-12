import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { content } from "@/db/schema";
import { eq, and, desc, notInArray } from "drizzle-orm";
import { getContentIdsLinkedToVideo } from "@/lib/content-video-links";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = { title: "Essays" };
export const dynamic = "force-dynamic";

export default async function EssaysPage() {
  const db = getDb();
  const videoLinkedIds = await getContentIdsLinkedToVideo();
  const posts = await db
    .select()
    .from(content)
    .where(
      and(
        eq(content.type, "essay"),
        eq(content.published, true),
        ...(videoLinkedIds.length > 0
          ? [notInArray(content.id, videoLinkedIds)]
          : [])
      )
    )
    .orderBy(desc(content.publishedAt));

  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader title="Essays" />
      {posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No essays yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((essay) => (
            <li key={essay.id} className="py-8">
              <Link href={`/essays/${essay.slug}`} className="group block">
                <time className="text-xs tracking-widest uppercase text-muted-foreground">
                  {essay.publishedAt
                    ? new Date(essay.publishedAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </time>
                <h2 className="font-heading text-2xl mt-1 group-hover:text-warm-accent transition-colors">
                  {essay.title}
                </h2>
                {essay.description && (
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {essay.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
