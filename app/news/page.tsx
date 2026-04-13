import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { content } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = { title: "News" };
export const dynamic = "force-dynamic";

export default async function NewsIndexPage() {
  const db = getDb();
  const posts = await db
    .select()
    .from(content)
    .where(and(eq(content.type, "news"), eq(content.published, true)))
    .orderBy(desc(content.publishedAt));

  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader title="News" />
      {posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No news yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((post) => (
            <li key={post.id} className="py-8">
              <Link href={`/news/${post.slug}`} className="group block">
                <time className="text-xs tracking-widest uppercase text-muted-foreground">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </time>
                <h2 className="font-heading text-2xl mt-1 group-hover:text-warm-accent transition-colors">
                  {post.title}
                </h2>
                {post.description ? (
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {post.description}
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
