import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import {
  collections,
  collectionItems,
  videoPoems,
  content,
  contentLinks,
} from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import {
  CollectionReader,
  type CollectionPoemItem,
} from "@/components/video/collection-reader";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ poem?: string }>;
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
      videoPoemId: videoPoems.id,
      slug: videoPoems.slug,
      title: videoPoems.title,
      vimeoId: videoPoems.vimeoId,
      thumbnailUrl: videoPoems.thumbnailUrl,
      thumbnailAlt: videoPoems.thumbnailAlt,
      description: videoPoems.description,
      durationSeconds: videoPoems.durationSeconds,
    })
    .from(collectionItems)
    .innerJoin(videoPoems, eq(collectionItems.videoPoemId, videoPoems.id))
    .where(eq(collectionItems.collectionId, collection.id))
    .orderBy(asc(collectionItems.position));

  const poemIds = rawItems.map((item) => item.videoPoemId);

  const essayRows =
    poemIds.length > 0
      ? await db
          .select({
            videoPoemId: contentLinks.videoPoemId,
            bodyHtml: content.bodyHtml,
          })
          .from(contentLinks)
          .innerJoin(content, eq(content.id, contentLinks.contentId))
          .where(
            and(
              inArray(contentLinks.videoPoemId, poemIds),
              eq(content.type, "essay"),
              eq(content.published, true)
            )
          )
      : [];

  const essayMap = new Map<number, string>();
  for (const row of essayRows) {
    if (row.videoPoemId != null) {
      essayMap.set(row.videoPoemId, row.bodyHtml);
    }
  }

  const items: CollectionPoemItem[] = rawItems.map((item) => ({
    slug: item.slug,
    title: item.title,
    vimeoId: item.vimeoId,
    thumbnailUrl: item.thumbnailUrl,
    thumbnailAlt: item.thumbnailAlt,
    description: item.description,
    durationSeconds: item.durationSeconds,
    essayHtml: essayMap.get(item.videoPoemId) ?? "",
  }));

  return { collection, items };
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const { poem: poemSlug } = await searchParams;

  const result = await getCollectionWithItems(slug);
  if (!result) return {};

  const { collection, items } = result;

  if (poemSlug) {
    const poem = items.find((i) => i.slug === poemSlug);
    if (poem) {
      return {
        title: poem.title,
        description: poem.description,
        openGraph: poem.thumbnailUrl
          ? { images: [{ url: poem.thumbnailUrl }] }
          : undefined,
      };
    }
  }

  return {
    title: collection.title,
    description: collection.description,
    openGraph: collection.coverImageUrl
      ? { images: [{ url: collection.coverImageUrl }] }
      : undefined,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { poem: poemSlug } = await searchParams;

  const result = await getCollectionWithItems(slug);
  if (!result) notFound();

  const { collection, items } = result;

  return (
    <CollectionReader
      collection={{
        title: collection.title,
        introHtml: collection.introHtml,
      }}
      items={items}
      activeSlug={poemSlug ?? null}
    />
  );
}
