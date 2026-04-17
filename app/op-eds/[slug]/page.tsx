import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/db";
import { opEdCollections, opEds } from "@/db/schema";
import { asc, eq, desc, and } from "drizzle-orm";
import { formatPublishedDate } from "@/lib/format-published-date";
import { OpEdMastheadImg } from "@/components/op-ed-masthead-img";
import { resolveOpEdCollectionMastheadUrl } from "@/lib/op-ed-masthead";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCollectionWithArticles(slug: string) {
  const db = getDb();

  const [collection] = await db
    .select()
    .from(opEdCollections)
    .where(eq(opEdCollections.slug, slug));

  if (!collection) return null;

  const articles = await db
    .select()
    .from(opEds)
    .where(
      and(
        eq(opEds.collectionId, collection.id),
        eq(opEds.published, true)
      )
    )
    .orderBy(desc(opEds.date));

  return { collection, articles };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollectionWithArticles(slug);
  if (!result) return {};
  const { collection } = result;
  const path = `/op-eds/${slug}`;
  const title = `${collection.publication} — Commentary and Analysis`;
  const desc = collection.description?.trim() || "Commentary and analysis on energy, climate, and the environment.";
  const imageUrl = collection.mastheadUrl?.trim() || undefined;
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_CA",
      siteName: "Ross Belot",
      title,
      description: desc,
      url: absoluteUrl(path),
      ...(imageUrl && { images: [{ url: imageUrl }] }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description: desc,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function OpEdCollectionPage({ params }: Props) {
  const { slug } = await params;
  const result = await getCollectionWithArticles(slug);
  if (!result) notFound();

  const { collection, articles } = result;
  const mastheadSrc = resolveOpEdCollectionMastheadUrl(
    collection.slug,
    collection.mastheadUrl
  );

  return (
    <main className="mx-auto w-full max-w-screen-lg px-6 py-16">
      {/* Back link */}
      <Link
        href="/op-eds"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Commentary and Analysis
      </Link>

      {/* Masthead */}
      <div className="mb-10 pb-6 border-b border-border">
        {mastheadSrc ? (
          <div className="mb-3">
            <OpEdMastheadImg
              src={mastheadSrc}
              alt={collection.publication}
              width={240}
              height={48}
              className="object-contain object-left h-12 w-auto max-w-sm"
            />
          </div>
        ) : (
          <h1 className="font-heading text-3xl mb-2">{collection.publication}</h1>
        )}
        {collection.description && (
          <p className="text-muted-foreground text-sm max-w-prose mt-3">
            {collection.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2 tracking-wide">
          {articles.length} article{articles.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Articles list */}
      {articles.length === 0 ? (
        <p className="text-muted-foreground text-sm">No articles yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {articles.map((item) => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-6 py-7 hover:bg-surface transition-colors -mx-4 px-4 rounded"
              >
                {/* Thumbnail */}
                {item.thumbnailUrl && (
                  <div className="shrink-0 w-36 h-24 relative overflow-hidden bg-muted rounded">
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      sizes="144px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <time className="text-xs tracking-widest uppercase text-muted-foreground">
                    {formatPublishedDate(new Date(item.date))}
                  </time>
                  <h2 className="font-heading text-xl mt-1 group-hover:text-warm-accent transition-colors leading-snug">
                    {item.title}
                  </h2>
                  {item.pullQuote && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      &ldquo;{item.pullQuote}&rdquo;
                    </p>
                  )}
                </div>

                {/* External link indicator */}
                <div className="shrink-0 self-center text-muted-foreground group-hover:text-warm-accent transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
