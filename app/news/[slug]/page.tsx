import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { newsItems } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { AuthorBio, siteAuthorName } from "@/components/author-bio";
import { formatPublishedDate } from "@/lib/format-published-date";
import { newsArticleJsonLd, articleMetadata, breadcrumbJsonLd, absoluteUrl } from "@/lib/seo";

// Static — every published slug is pre-rendered via generateStaticParams and
// regenerated only on publish via server-action revalidatePath (no ISR timer).
export const dynamic = "force-static";
export const revalidate = false;

interface Props {
  params: Promise<{ slug: string }>;
}

// Pre-render every published on-site news story slug at build; new slugs render
// on-demand (dynamicParams defaults to true) and cache until publish revalidation.
export async function generateStaticParams() {
  const db = getDb();
  const rows = await db
    .select({ slug: newsItems.slug })
    .from(newsItems)
    .where(
      and(
        eq(newsItems.published, true),
        eq(newsItems.kind, "story"),
        isNotNull(newsItems.slug)
      )
    );
  return rows
    .map((r) => r.slug)
    .filter((s): s is string => !!s)
    .map((slug) => ({ slug }));
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

  const jsonLd = newsArticleJsonLd({
    title: row.title,
    description: row.description,
    path: `/news/${row.slug}`,
    publishedAt: row.date ? new Date(row.date + "T12:00:00") : null,
  });

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: absoluteUrl("/") },
    { name: "News", url: absoluteUrl("/happenings") },
    { name: row.title, url: absoluteUrl(`/news/${row.slug}`) },
  ]);

  return (
    <main id="main" className="essay-layout">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }}
      />
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
