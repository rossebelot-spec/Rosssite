import type { Metadata } from "next";
import Image from "next/image";
import { getDb } from "@/db";
import { content } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { AuthorBio, siteAuthorName } from "@/components/author-bio";
import { formatPublishedDate } from "@/lib/format-published-date";
import { blobImageUrl } from "@/lib/blob";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const db = getDb();
  const [row] = await db
    .select({
      title: content.title,
      description: content.description,
    })
    .from(content)
    .where(
      and(eq(content.type, "about"), eq(content.slug, "about"), eq(content.published, true))
    )
    .limit(1);
  if (!row) {
    return {
      title: "About",
      alternates: { canonical: "/about" },
      openGraph: { url: absoluteUrl("/about"), title: "About | Ross Belot" },
    };
  }
  const desc = row.description?.trim() || undefined;
  return {
    title: row.title,
    description: desc,
    alternates: { canonical: "/about" },
    openGraph: {
      title: row.title,
      description: desc,
      url: absoluteUrl("/about"),
      locale: "en_CA",
      siteName: "Ross Belot",
    },
    twitter: {
      card: "summary",
      title: row.title,
      description: desc,
    },
  };
}

export default async function AboutPage() {
  const db = getDb();
  const [about] = await db
    .select()
    .from(content)
    .where(
      and(eq(content.type, "about"), eq(content.slug, "about"), eq(content.published, true))
    )
    .limit(1);

  if (!about) {
    return (
      <main id="main" className="essay-layout">
        <header className="essay-header">
          <p className="essay-kicker">About</p>
          <h1 className="essay-title">About</h1>
        </header>
        <section className="essay-bio" aria-labelledby="about-fallback-bio-heading">
          <h2 id="about-fallback-bio-heading" className="essay-bio-section-heading">
            Article Author Biography
          </h2>
          <AuthorBio />
        </section>
      </main>
    );
  }

  const dateLabel = formatPublishedDate(about.publishedAt);
  const dateIso = about.publishedAt ? new Date(about.publishedAt).toISOString() : undefined;

  return (
    <main id="main" className="essay-layout">
      <header className="essay-header">
        <p className="essay-kicker">About</p>
        <h1 className="essay-title">{about.title}</h1>
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

      {about.imageUrl ? (
        <div className="relative mx-auto mb-10 w-full max-w-xs aspect-about-portrait overflow-hidden rounded-md bg-surface">
          <Image
            src={blobImageUrl(about.imageUrl)}
            alt={about.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 320px"
            unoptimized
          />
        </div>
      ) : null}

      <article className="essay-body" dangerouslySetInnerHTML={{ __html: about.bodyHtml }} />

      <section className="essay-bio" aria-labelledby="essay-bio-heading">
        <h2 id="essay-bio-heading" className="essay-bio-section-heading">
          Article Author Biography
        </h2>
        <AuthorBio />
      </section>
    </main>
  );
}
