import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { collections, collectionItems, videoPoems } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
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

  const items: CollectionPoemItem[] = await db
    .select({
      slug: videoPoems.slug,
      title: videoPoems.title,
      vimeoId: videoPoems.vimeoId,
      thumbnailUrl: videoPoems.thumbnailUrl,
      thumbnailAlt: videoPoems.thumbnailAlt,
      essayHtml: videoPoems.essayHtml,
      description: videoPoems.description,
      durationSeconds: videoPoems.durationSeconds,
    })
    .from(collectionItems)
    .innerJoin(videoPoems, eq(collectionItems.videoPoemId, videoPoems.id))
    .where(eq(collectionItems.collectionId, collection.id))
    .orderBy(asc(collectionItems.position));

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
