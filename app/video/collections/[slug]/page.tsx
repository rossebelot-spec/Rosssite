import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { collections, collectionItems, videos, content, contentLinks } from "@/db/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import {
  CollectionReader,
  type CollectionVideoItem,
} from "@/components/video/collection-reader";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

// Static — every published video collection slug is pre-rendered via
// generateStaticParams; poem selection (?poem=) is handled client-side in
// CollectionReader, so the page stays statically cached and regenerates only on publish.
export const dynamic = "force-static";
export const revalidate = false;

interface Props {
  params: Promise<{ slug: string }>;
}

// Pre-render every published video collection slug at build; new slugs render
// on-demand (dynamicParams defaults to true) and cache until publish revalidation.
export async function generateStaticParams() {
  const db = getDb();
  const rows = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(
      and(eq(collections.published, true), eq(collections.mediaType, "video"))
    );
  return rows.map((r) => ({ slug: r.slug }));
}

async function getCollectionWithItems(slug: string) {
  const db = getDb();
  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.published, true)));

  if (!collection) return null;

  const rawItems = await db
    .select({
      videoId: videos.id,
      slug: videos.slug,
      title: videos.title,
      r2Url: videos.r2Url,
      thumbnailUrl: videos.thumbnailUrl,
      thumbnailAlt: videos.thumbnailAlt,
      description: videos.description,
      durationSeconds: videos.durationSeconds,
    })
    .from(collectionItems)
    .innerJoin(
      videos,
      and(
        eq(collectionItems.linkedType, "video"),
        eq(collectionItems.linkedId, videos.id),
        eq(videos.published, true)
      )
    )
    .where(eq(collectionItems.collectionId, collection.id))
    .orderBy(asc(collectionItems.position));

  const videoIds = rawItems.map((item) => item.videoId);

  const essayRows =
    videoIds.length > 0
      ? await db
          .select({
            videoId: contentLinks.videoId,
            bodyHtml: content.bodyHtml,
            essayTitle: content.title,
          })
          .from(contentLinks)
          .innerJoin(content, eq(content.id, contentLinks.contentId))
          .where(
            and(
              inArray(contentLinks.videoId, videoIds),
              inArray(content.type, ["essay", "blog"]),
              eq(content.published, true)
            )
          )
          .orderBy(desc(content.id))
      : [];

  const essayMap = new Map<number, { bodyHtml: string; essayTitle: string }>();
  for (const row of essayRows) {
    if (row.videoId != null && !essayMap.has(row.videoId)) {
      essayMap.set(row.videoId, {
        bodyHtml: row.bodyHtml,
        essayTitle: row.essayTitle,
      });
    }
  }

  const items: CollectionVideoItem[] = rawItems.map((item) => {
    const linked = essayMap.get(item.videoId);
    return {
      slug: item.slug,
      title: item.title,
      r2Url: item.r2Url,
      thumbnailUrl: item.thumbnailUrl,
      thumbnailAlt: item.thumbnailAlt,
      description: item.description,
      durationSeconds: item.durationSeconds,
      essayTitle: linked?.essayTitle ?? "",
      essayHtml: linked?.bodyHtml ?? "",
    };
  });

  return { collection, items };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollectionWithItems(slug);
  if (!result) return {};
  const { collection } = result;

  const path = `/video/collections/${slug}`;
  const desc = collection.description?.trim() || undefined;
  return {
    title: collection.title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: collection.title,
      description: desc,
      url: absoluteUrl(path),
      locale: "en_CA",
      siteName: "Ross Belot",
      ...(collection.coverImageUrl && { images: [{ url: collection.coverImageUrl }] }),
    },
    twitter: {
      card: collection.coverImageUrl ? "summary_large_image" : "summary",
      title: collection.title,
      description: desc,
      ...(collection.coverImageUrl && { images: [collection.coverImageUrl] }),
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;

  const result = await getCollectionWithItems(slug);
  if (!result) notFound();

  const { collection, items } = result;

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Video", url: absoluteUrl("/video") },
    { name: collection.title, url: absoluteUrl(`/video/collections/${slug}`) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }}
      />
      <CollectionReader
        collection={{ title: collection.title, introHtml: collection.introHtml ?? "" }}
        items={items}
      />
    </>
  );
}
