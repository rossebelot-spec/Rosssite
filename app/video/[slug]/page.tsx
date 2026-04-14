import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/db";
import { videos, content, contentLinks, collections, collectionItems } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { VideoMain } from "@/components/video/video-main";
import { videoObjectJsonLd, videoPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getVideo(slug: string) {
  const db = getDb();
  const [video] = await db
    .select()
    .from(videos)
    .where(and(eq(videos.slug, slug), eq(videos.published, true)));

  if (!video) return null;

  const [linkedEssay] = await db
    .select({
      essayTitle: content.title,
      bodyHtml: content.bodyHtml,
    })
    .from(contentLinks)
    .innerJoin(content, eq(content.id, contentLinks.contentId))
    .where(
      and(
        eq(contentLinks.videoId, video.id),
        inArray(content.type, ["essay", "blog"]),
        eq(content.published, true)
      )
    )
    .limit(1);

  const memberCollections = await db
    .select({
      title: collections.title,
      slug: collections.slug,
    })
    .from(collectionItems)
    .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
    .where(
      and(
        eq(collectionItems.linkedType, "video"),
        eq(collectionItems.linkedId, video.id),
        eq(collections.published, true)
      )
    );

  return { video, linkedEssay: linkedEssay ?? null, memberCollections };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getVideo(slug);
  if (!result) return {};
  const { video, linkedEssay } = result;
  const title = (linkedEssay?.essayTitle ?? "").trim() || video.title;
  return videoPageMetadata({
    title,
    description: video.description,
    path: `/video/${slug}`,
    thumbnailUrl: video.thumbnailUrl,
  });
}

export default async function VideoSlugPage({ params }: Props) {
  const { slug } = await params;
  const result = await getVideo(slug);
  if (!result) notFound();
  const { video, linkedEssay, memberCollections } = result;

  const displayTitle = (linkedEssay?.essayTitle ?? "").trim() || video.title;
  const jsonLd = videoObjectJsonLd({
    name: displayTitle,
    description: video.description,
    path: `/video/${slug}`,
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt,
  });

  return (
    <div className="reading-theme essay-reading-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="journal-folio-paper essay-reading-paper">
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <Link href="/video" className="hover:text-foreground transition-colors">
            ← Video
          </Link>
          {memberCollections.map((coll) => (
            <Link
              key={coll.slug}
              href={`/video/collections/${coll.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {coll.title}
            </Link>
          ))}
        </div>
        <VideoMain
          videoTitle={video.title}
          essayTitle={linkedEssay?.essayTitle}
          vimeoId={video.vimeoId}
          r2Url={video.r2Url}
          thumbnailUrl={video.thumbnailUrl}
          essayHtml={linkedEssay?.bodyHtml ?? ""}
        />
      </div>
    </div>
  );
}
