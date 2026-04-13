import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/db";
import { opEdCollections, opEds } from "@/db/schema";
import { asc, eq, isNull, desc } from "drizzle-orm";
import { SectionHeader } from "@/components/section-header";
import { formatPublishedDate } from "@/lib/format-published-date";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Op-eds" };

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
        .where(eq(opEds.collectionId, col.id))
        .orderBy(desc(opEds.date));

      const coverUrl = articles[0]?.thumbnailUrl ?? null;
      return { ...col, articleCount: articles.length, coverUrl };
    })
  );

  // Standalone articles (not in any collection), sorted newest-first
  const standaloneArticles = await db
    .select()
    .from(opEds)
    .where(isNull(opEds.collectionId))
    .orderBy(desc(opEds.date));

  const hasCollections = collectionsWithMeta.some((c) => c.articleCount > 0);

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader
        title="Op-eds"
        description="Published opinion and analysis on energy, climate, and the environment."
      />

      {!hasCollections && standaloneArticles.length === 0 ? (
        <p className="text-muted-foreground text-sm">No op-eds published yet.</p>
      ) : (
        <div className="space-y-16">
          {/* ── Collections ─────────────────────────────────────────────── */}
          {hasCollections && (
            <section>
              <h2 className="font-heading text-xl mb-6 text-muted-foreground tracking-wide">
                Collections
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {collectionsWithMeta
                  .filter((col) => col.articleCount > 0)
                  .map((col) => (
                    <Link
                      key={col.id}
                      href={`/op-eds/${col.slug}`}
                      className="group flex flex-col gap-3"
                    >
                      {/* Cover image: most recent article thumbnail */}
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
                          {/* Masthead overlay */}
                          {col.mastheadUrl && (
                            <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                              <Image
                                src={col.mastheadUrl}
                                alt={col.publication}
                                width={160}
                                height={32}
                                className="object-contain object-left h-8 w-auto brightness-0 invert"
                                unoptimized
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-surface rounded flex items-center justify-center">
                          {col.mastheadUrl ? (
                            <Image
                              src={col.mastheadUrl}
                              alt={col.publication}
                              width={160}
                              height={32}
                              className="object-contain h-8 w-auto"
                              unoptimized
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {col.publication}
                            </span>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="font-heading text-lg group-hover:text-warm-accent transition-colors">
                          {col.publication}
                        </p>
                        {col.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {col.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {col.articleCount} article{col.articleCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* ── Standalone articles ──────────────────────────────────────── */}
          {standaloneArticles.length > 0 && (
            <section>
              <h2 className="font-heading text-xl mb-6 text-muted-foreground tracking-wide">
                Other Publications
              </h2>
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
