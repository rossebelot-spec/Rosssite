import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { content } from "@/db/schema";
import { eq, and, desc, inArray, notInArray, sql } from "drizzle-orm";
import { getContentIdsLinkedToVideo } from "@/lib/content-video-links";
import { formatPublishedDateLong } from "@/lib/format-published-date";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Literary",
  description: "Books, journals, and formally published work.",
};

export const dynamic = "force-dynamic";

export default async function LiteraryPage() {
  const db = getDb();
  const videoLinkedIds = await getContentIdsLinkedToVideo();
  const posts = await db
    .select()
    .from(content)
    .where(
      and(
        inArray(content.type, ["essay", "blog"]),
        eq(content.published, true),
        sql`'literary' = ANY(${content.tags})`,
        ...(videoLinkedIds.length > 0 ? [notInArray(content.id, videoLinkedIds)] : [])
      )
    )
    .orderBy(desc(content.publishedAt));

  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader
        title="Literary"
        description="Books, journals, and formally published work. Tag pieces with literary in the admin editor to list them here."
      />
      {posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No literary items yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((row) => (
            <li key={row.id} className="py-6">
              <Link href={`/essays/${row.slug}`} className="group block">
                <time className="text-xs tracking-widest uppercase text-muted-foreground">
                  {formatPublishedDateLong(
                    row.publishedAt ? new Date(row.publishedAt) : null
                  )}
                </time>
                <h2 className="font-heading text-xl mt-1 group-hover:text-warm-accent transition-colors">
                  {row.title}
                </h2>
                {row.description ? (
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {row.description}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
