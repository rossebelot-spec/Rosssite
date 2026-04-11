import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  collections,
  collectionItems,
  videoPoems,
  content,
  contentLinks,
} from "@/db/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import {
  CollectionReader,
  type CollectionPoemItem,
} from "@/components/video/collection-reader";
import { SetNavContextLine } from "@/components/nav-context";

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

  // Linked essay prose: `content.title` + `body_html` for the reader (same row).
  const essayRows =
    poemIds.length > 0
      ? await db
          .select({
            videoPoemId: contentLinks.videoPoemId,
            bodyHtml: content.bodyHtml,
            essayTitle: content.title,
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
          .orderBy(desc(content.id))
      : [];

  const essayMap = new Map<
    number,
    { bodyHtml: string; essayTitle: string }
  >();
  for (const row of essayRows) {
    if (row.videoPoemId != null && !essayMap.has(row.videoPoemId)) {
      essayMap.set(row.videoPoemId, {
        bodyHtml: row.bodyHtml,
        essayTitle: row.essayTitle,
      });
    }
  }

  const items: CollectionPoemItem[] = rawItems.map((item) => {
    const linked = essayMap.get(item.videoPoemId);
    return {
      slug: item.slug,
      title: item.title,
      vimeoId: item.vimeoId,
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
      const tabTitle = (poem.essayTitle ?? "").trim() || poem.title;
      return {
        title: tabTitle,
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

  if (!poemSlug && items.length > 0) {
    redirect(
      `/video/collections/${encodeURIComponent(slug)}?poem=${encodeURIComponent(items[0].slug)}`
    );
  }

  return (
    <>
      <SetNavContextLine line={`Collection: ${collection.title}`} />
      <CollectionReader
        collection={{
          title: collection.title,
          introHtml: collection.introHtml,
        }}
        items={items}
        activeSlug={poemSlug ?? null}
      />
    </>
  );
}
