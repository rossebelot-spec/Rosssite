import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import { collections, collectionItems, videos, content, contentLinks } from "@/db/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import {
  CollectionReader,
  type CollectionVideoItem,
} from "@/components/video/collection-reader";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ poem?: string | string[] }>;
}

/** Empty or whitespace `?poem=` must be treated as absent to avoid redirect loops. */
function poemParamFromSearchParams(sp: { poem?: string | string[] }): string | undefined {
  const raw = sp.poem;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  return t.length > 0 ? t : undefined;
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
      vimeoId: videos.vimeoId,
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
      vimeoId: item.vimeoId,
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

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const poemSlug = poemParamFromSearchParams(await searchParams);
  const result = await getCollectionWithItems(slug);
  if (!result) return {};
  const { collection, items } = result;

  if (poemSlug) {
    const video = items.find((i) => i.slug === poemSlug);
    if (video) {
      const tabTitle = (video.essayTitle ?? "").trim() || video.title;
      return {
        title: tabTitle,
        description: video.description,
        openGraph: video.thumbnailUrl
          ? { images: [{ url: video.thumbnailUrl }] }
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

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const poemSlug = poemParamFromSearchParams(await searchParams);

  const result = await getCollectionWithItems(slug);
  if (!result) notFound();

  const { collection, items } = result;

  // Redirect to first video if none selected
  if (!poemSlug && items.length > 0) {
    const first = items.find((i) => i.slug?.trim());
    if (first?.slug?.trim()) {
      redirect(
        `/video/collections/${encodeURIComponent(slug)}?poem=${encodeURIComponent(first.slug)}`
      );
    }
  }

  return (
    <CollectionReader
      collection={{ title: collection.title, introHtml: collection.introHtml ?? "" }}
      items={items}
      activeSlug={poemSlug ?? null}
    />
  );
}
