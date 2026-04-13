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
  const [row] = await db
    .select()
    .from(content)
    .where(
      and(
        eq(content.slug, slug),
        eq(content.type, "event"),
        eq(content.published, true)
      )
    )
    .limit(1);
  if (!row) return {};
  return { title: row.title, description: row.description };
}

export default async function EventPiecePage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [row] = await db
    .select()
    .from(content)
    .where(
      and(
        eq(content.slug, slug),
        eq(content.type, "event"),
        eq(content.published, true)
      )
    )
    .limit(1);

  if (!row) notFound();

  const dateLabel = formatPublishedDate(row.publishedAt);
  const dateIso = row.publishedAt
    ? new Date(row.publishedAt).toISOString()
    : undefined;

  return (
    <main id="main" className="essay-layout">
      <div className="essay-toolbar">
        <Link href="/events" className="essay-back-link">
          Back to Events
        </Link>
        <div className="essay-pdf-slot" aria-hidden="true" />
      </div>

      <header className="essay-header">
        <p className="essay-kicker">Event</p>
        <h1 className="essay-title">{row.title}</h1>
        {row.topic ? (
          <p className="mt-2 font-sans-reading text-sm text-muted-foreground">
            {row.topic}
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
        dangerouslySetInnerHTML={{ __html: row.bodyHtml }}
      />

      <section className="essay-bio" aria-labelledby="event-bio-heading">
        <h2 id="event-bio-heading" className="essay-bio-section-heading">
          Article Author Biography
        </h2>
        <AuthorBio />
      </section>
    </main>
  );
}
