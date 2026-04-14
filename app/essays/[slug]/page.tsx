import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { content } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { AuthorBio, siteAuthorName } from "@/components/author-bio";
import { formatPublishedDate } from "@/lib/format-published-date";
import { articleJsonLd, articleMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [essay] = await db
    .select()
    .from(content)
    .where(
      and(
        eq(content.slug, slug),
        inArray(content.type, ["essay", "blog"]),
        eq(content.published, true)
      )
    )
    .limit(1);
  if (!essay) return {};
  const path = `/essays/${essay.slug}`;
  return articleMetadata({
    title: essay.title,
    description: essay.description,
    path,
    publishedAt: essay.publishedAt,
    imageUrl: essay.imageUrl,
  });
}

export default async function EssayPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [essay] = await db
    .select()
    .from(content)
    .where(
      and(
        eq(content.slug, slug),
        inArray(content.type, ["essay", "blog"]),
        eq(content.published, true)
      )
    )
    .limit(1);

  if (!essay) notFound();

  const dateLabel = formatPublishedDate(essay.publishedAt);
  const dateIso = essay.publishedAt ? new Date(essay.publishedAt).toISOString() : undefined;
  const kicker = essay.type === "blog" ? "Blog" : "Essay";

  const jsonLd = articleJsonLd({
    title: essay.title,
    description: essay.description,
    path: `/essays/${essay.slug}`,
    publishedAt: essay.publishedAt,
  });

  return (
    <main id="main" className="essay-layout">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="essay-toolbar">
        <Link href="/essays" className="essay-back-link">
          Back to Essays
        </Link>
        <div className="essay-pdf-slot" aria-hidden="true" />
      </div>

      <header className="essay-header">
        <p className="essay-kicker">{kicker}</p>
        <h1 className="essay-title">{essay.title}</h1>
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

      <article className="essay-body" dangerouslySetInnerHTML={{ __html: essay.bodyHtml }} />

      <section className="essay-bio" aria-labelledby="essay-bio-heading">
        <h2 id="essay-bio-heading" className="essay-bio-section-heading">
          Article Author Biography
        </h2>
        <AuthorBio />
      </section>
    </main>
  );
}
