import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { content } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AuthorBio, siteAuthorName } from "@/components/author-bio";
import { formatPublishedDate } from "@/lib/format-published-date";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [review] = await db
    .select()
    .from(content)
    .where(
      and(
        eq(content.slug, slug),
        eq(content.type, "review"),
        eq(content.published, true)
      )
    )
    .limit(1);
  if (!review) return {};
  return { title: review.title, description: review.description };
}

export default async function BookReviewPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [review] = await db
    .select()
    .from(content)
    .where(
      and(
        eq(content.slug, slug),
        eq(content.type, "review"),
        eq(content.published, true)
      )
    )
    .limit(1);

  if (!review) notFound();

  const dateLabel = formatPublishedDate(review.publishedAt);
  const dateIso = review.publishedAt
    ? new Date(review.publishedAt).toISOString()
    : undefined;

  return (
    <main id="main" className="essay-layout">
      <div className="essay-toolbar">
        <Link href="/book-reviews" className="essay-back-link">
          Back to Book Reviews
        </Link>
        <div className="essay-pdf-slot" aria-hidden="true" />
      </div>

      <header className="essay-header">
        <p className="essay-kicker">Review</p>
        <h1 className="essay-title">{review.title}</h1>
        {review.topic ? (
          <p className="mt-2 font-sans-reading text-sm text-muted-foreground">
            by {review.topic}
          </p>
        ) : null}
        <p className="essay-meta">
          <span>{siteAuthorName}</span>
          {dateLabel ? (
            <>
              <span className="essay-meta-sep" aria-hidden="true">
                &middot;
              </span>
              <time dateTime={dateIso}>{dateLabel}</time>
            </>
          ) : null}
        </p>
      </header>

      <article
        className="essay-body"
        dangerouslySetInnerHTML={{ __html: review.bodyHtml }}
      />

      <section className="essay-bio" aria-labelledby="review-bio-heading">
        <h2 id="review-bio-heading" className="essay-bio-section-heading">
          Article Author Biography
        </h2>
        <AuthorBio />
      </section>
    </main>
  );
}
