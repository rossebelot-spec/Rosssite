import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/db";
import { opEdCollections, opEds } from "@/db/schema";
import { asc, eq, isNull, desc, and } from "drizzle-orm";
import {
  SectionHeader,
  SectionSubheading,
} from "@/components/section-header";
import { formatPublishedDate } from "@/lib/format-published-date";
import { OpEdMastheadImg } from "@/components/op-ed-masthead-img";
import { resolveOpEdCollectionMastheadUrl } from "@/lib/op-ed-masthead";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Commentary and Analysis",
  description:
    "Commentary and analysis on energy, climate, and the environment.",
  alternates: { canonical: "/op-eds" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Ross Belot",
    title: "Commentary and Analysis | Ross Belot",
    description: "Commentary and analysis on energy, climate, and the environment.",
    url: absoluteUrl("/op-eds"),
  },
  twitter: {
    card: "summary",
    title: "Commentary and Analysis | Ross Belot",
    description: "Commentary and analysis on energy, climate, and the environment.",
  },
};

export default async function OpEdsPage() {
  const db = getDb();

  const allCollections = await db
    .select()
    .from(opEdCollections)
    .orderBy(asc(opEdCollections.displayOrder), asc(opEdCollections.id));

  // For each collection, get article count + most recent article thumbnail for cover
  const collectionsWithMeta = await Promise.all(
    allCollections.map(async (col) => {
      const articles = await db
        .select({
          id: opEds.id,
          thumbnailUrl: opEds.thumbnailUrl,
          date: opEds.date,
        })
        .from(opEds)
        .where(
          and(
            eq(opEds.collectionId, col.id),
            eq(opEds.published, true)
          )
        )
        .orderBy(desc(opEds.date));

      const coverUrl = articles[0]?.thumbnailUrl ?? null;
      return { ...col, articleCount: articles.length, coverUrl };
    })
  );

  // Standalone articles (not in any collection), sorted newest-first
  const standaloneArticles = await db
    .select()
    .from(opEds)
    .where(
      and(isNull(opEds.collectionId), eq(opEds.published, true))
    )
    .orderBy(desc(opEds.date));

  const hasCollections = collectionsWithMeta.some((c) => c.articleCount > 0);

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader
        title="Commentary and Analysis"
        description="Commentary and analysis on energy, climate, and the environment."
      />

      {!hasCollections && standaloneArticles.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No commentary and analysis published yet.
        </p>
      ) : (
        <div className="space-y-16">
          {/* ── Collections ─────────────────────────────────────────────── */}
          {hasCollections && (
            <section>
              <SectionSubheading className="mb-6">Collections</SectionSubheading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {collectionsWithMeta
                  .filter((col) => col.articleCount > 0)
                  .map((col) => {
                    const mastheadSrc = resolveOpEdCollectionMastheadUrl(
                      col.slug,
                      col.mastheadUrl
                    );
                    return (
                    <Link
                      key={col.id}
                      href={`/op-eds/${col.slug}`}
                      className="group flex flex-col gap-3"
                    >
                      {/* Cover: article thumbnail only (masthead sits under the title below) */}
                      {col.coverUrl ? (
                        <div className="relative aspect-video bg-surface overflow-hidden rounded">
                          <Image
                            src={col.coverUrl}
                            alt={col.publication}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div
                          className="aspect-video rounded border border-dashed border-border bg-surface"
                          aria-hidden
                        />
                      )}

                      <div>
                        <p className="font-heading text-lg group-hover:text-warm-accent transition-colors">
                          {col.publication}
                        </p>
                        {mastheadSrc ? (
                          <div className="mt-2">
                            <OpEdMastheadImg
                              src={mastheadSrc}
                              alt={`${col.publication} logo`}
                              width={200}
                              height={40}
                              className="h-8 max-h-10 w-auto max-w-48 object-contain object-left"
                            />
                          </div>
                        ) : null}
                        {col.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {col.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {col.articleCount} article{col.articleCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                    );
                  })}
              </div>
            </section>
          )}

          {/* ── Standalone articles ──────────────────────────────────────── */}
          {standaloneArticles.length > 0 && (
            <section>
              <SectionSubheading className="mb-6">
                Other publications
              </SectionSubheading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {standaloneArticles.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-3"
                  >
                    {item.thumbnailUrl ? (
                      <div className="relative aspect-video bg-surface overflow-hidden rounded">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-surface rounded flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No image</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-baseline gap-3 mb-1">
                        <time className="text-xs tracking-widest uppercase text-muted-foreground">
                          {formatPublishedDate(new Date(item.date))}
                        </time>
                        <span className="text-xs tracking-widest uppercase text-warm-accent">
                          {item.publication}
                        </span>
                      </div>
                      <p className="font-heading text-lg group-hover:text-warm-accent transition-colors leading-snug">
                        {item.title}
                      </p>
                      {item.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
