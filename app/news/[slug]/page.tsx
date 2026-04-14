import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { newsItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { AuthorBio, siteAuthorName } from "@/components/author-bio";
import { formatPublishedDate } from "@/lib/format-published-date";
import { articleJsonLd, articleMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [row] = await db
    .select()
    .from(newsItems)
    .where(and(eq(newsItems.slug, slug), eq(newsItems.published, true)))
    .limit(1);
  if (!row || row.kind !== "story" || !row.bodyHtml?.trim()) return {};
  const path = `/news/${row.slug}`;
  return articleMetadata({
    title: row.title,
    description: row.description,
    path,
    publishedAt: row.date ? new Date(row.date + "T12:00:00") : null,
  });
}

export default async function NewsStoryPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [row] = await db
    .select()
    .from(newsItems)
    .where(and(eq(newsItems.slug, slug), eq(newsItems.published, true)))
    .limit(1);

  if (!row || row.kind !== "story" || !row.bodyHtml?.trim()) notFound();

  const dateLabel = formatPublishedDate(row.date ? new Date(row.date + "T12:00:00") : null);
  const dateIso = row.date ? new Date(row.date + "T12:00:00").toISOString() : undefined;

  const jsonLd = articleJsonLd({
    title: row.title,
    description: row.description,
    path: `/news/${row.slug}`,
    publishedAt: row.date ? new Date(row.date + "T12:00:00") : null,
  });

  return (
    <main id="main" className="essay-layout">
      <JsonLd data={jsonLd} />
      <div className="essay-toolbar">
        <Link href="/news" className="essay-back-link">
          Back to News
        </Link>
        <div className="essay-pdf-slot" aria-hidden="true" />
      </div>

      <header className="essay-header">
        <p className="essay-kicker">News</p>
        <h1 className="essay-title">{row.title}</h1>
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

      <article className="essay-body" dangerouslySetInnerHTML={{ __html: row.bodyHtml }} />

      <section className="essay-bio" aria-labelledby="news-bio-heading">
        <h2 id="news-bio-heading" className="essay-bio-section-heading">
          Article Author Biography
        </h2>
        <AuthorBio />
      </section>
    </main>
  );
}
