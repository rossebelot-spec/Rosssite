import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { bookReviews } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [review] = await db
    .select()
    .from(bookReviews)
    .where(and(eq(bookReviews.slug, slug), eq(bookReviews.published, true)));
  if (!review) return {};
  return { title: review.title, description: review.description };
}

export default async function BookReviewPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [review] = await db
    .select()
    .from(bookReviews)
    .where(and(eq(bookReviews.slug, slug), eq(bookReviews.published, true)));

  if (!review) notFound();

  return (
    <main className="mx-auto w-full max-w-screen-sm px-6 py-16">
      <header className="mb-10 border-b border-border pb-8">
        <time className="text-xs tracking-widest uppercase text-muted-foreground">
          {review.publishedAt
            ? new Date(review.publishedAt).toLocaleDateString("en-CA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </time>
        <h1 className="font-heading text-4xl mt-2">{review.title}</h1>
        <p className="text-xs tracking-widest uppercase text-muted-foreground mt-1">
          {review.author}
        </p>
        {review.description && (
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {review.description}
          </p>
        )}
      </header>

      <article
        className="prose prose-sm max-w-none font-sans leading-relaxed"
        dangerouslySetInnerHTML={{ __html: review.bodyHtml }}
      />
    </main>
  );
}
