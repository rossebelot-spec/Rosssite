import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { essays } from "@/db/schema";
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
  const [essay] = await db
    .select()
    .from(essays)
    .where(and(eq(essays.slug, slug), eq(essays.published, true)));
  if (!essay) return {};
  return { title: essay.title, description: essay.description };
}

export default async function EssayPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [essay] = await db
    .select()
    .from(essays)
    .where(and(eq(essays.slug, slug), eq(essays.published, true)));

  if (!essay) notFound();

  const dateLabel = formatPublishedDate(essay.publishedAt);
  const dateIso = essay.publishedAt ? new Date(essay.publishedAt).toISOString() : undefined;

  return (
    <main id="main" className="essay-layout">
      <div className="essay-toolbar">
        <Link href="/essays" className="essay-back-link">
          Back to Essays
        </Link>
        <div className="essay-pdf-slot" aria-hidden="true" />
      </div>

      <header className="essay-header">
        <p className="essay-kicker">Essay</p>
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
