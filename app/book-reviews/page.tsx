import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { content } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = { title: "Book Reviews" };
export const dynamic = "force-dynamic";

export default async function BookReviewsPage() {
  const db = getDb();
  const reviews = await db
    .select()
    .from(content)
    .where(and(eq(content.type, "review"), eq(content.published, true)))
    .orderBy(desc(content.publishedAt));

  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader title="Book Reviews" />
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {reviews.map((review) => (
            <li key={review.id} className="py-8">
              <Link href={`/book-reviews/${review.slug}`} className="group block">
                <time className="text-xs tracking-widest uppercase text-muted-foreground">
                  {review.publishedAt
                    ? new Date(review.publishedAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </time>
                <h2 className="font-heading text-2xl mt-1 group-hover:text-warm-accent transition-colors">
                  {review.title}
                </h2>
                <p className="text-xs tracking-widest uppercase text-muted-foreground mt-1">
                  {"by " + review.topic}
                </p>
                {review.description && (
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                    {review.description}
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
