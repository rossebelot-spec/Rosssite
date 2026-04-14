import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/db";
import { collections, videos, collectionItems } from "@/db/schema";
import { eq, and, asc, desc, isNull, ne } from "drizzle-orm";
import { getFeaturedHomeVideo } from "@/lib/featured-home-video";
import {
  SectionHeader,
  SectionSubheading,
} from "@/components/section-header";

export const metadata: Metadata = { title: "Multimedia" };
export const dynamic = "force-dynamic";

function collectionKindLabel(mediaType: string) {
  return mediaType === "photo" ? "Photo collection" : "Video collection";
}

export default async function MultimediaPage() {
  const db = getDb();
  const featuredHome = await getFeaturedHomeVideo();

  const [published, standaloneVideos] = await Promise.all([
    db
      .select()
      .from(collections)
      .where(eq(collections.published, true))
      .orderBy(asc(collections.displayOrder)),
    db
      .select({
        id: videos.id,
        slug: videos.slug,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl,
        thumbnailAlt: videos.thumbnailAlt,
        description: videos.description,
        durationSeconds: videos.durationSeconds,
      })
      .from(videos)
      .leftJoin(
        collectionItems,
        and(
          eq(collectionItems.linkedType, "video"),
          eq(collectionItems.linkedId, videos.id)
        )
      )
      .where(
        and(
          eq(videos.published, true),
          isNull(collectionItems.id),
          ...(featuredHome ? [ne(videos.id, featuredHome.id)] : [])
        )
      )
      .orderBy(desc(videos.publishedAt)),
  ]);

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader
        title="Multimedia"
        description="Video and photography collections."
      />

      {published.length === 0 && standaloneVideos.length === 0 ? (
        <p className="text-muted-foreground text-sm">No multimedia yet.</p>
      ) : (
        <div className="space-y-16">
          {published.length > 0 && (
            <section>
              <SectionSubheading className="mb-6">Collections</SectionSubheading>
              <ul className="divide-y divide-border">
                {published.map((coll) => (
                  <li key={coll.id}>
                    <Link
                      href={
                        coll.mediaType === "photo"
                          ? `/photography/collections/${coll.slug}`
                          : `/video/collections/${coll.slug}`
                      }
                      className="group flex gap-6 py-7 hover:bg-surface transition-colors -mx-4 px-4 rounded"
                    >
                      <div className="shrink-0 w-36 h-24 relative overflow-hidden bg-muted rounded">
                        {coll.coverImageUrl ? (
                          <Image
                            src={coll.coverImageUrl}
                            alt={coll.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="144px"
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs px-1 text-center">
                            No cover
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs tracking-widest uppercase text-warm-accent mb-1">
                          {collectionKindLabel(coll.mediaType)}
                        </p>
                        <h2 className="font-heading text-xl group-hover:text-warm-accent transition-colors leading-snug">
                          {coll.title}
                        </h2>
                        {coll.description && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                            {coll.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {standaloneVideos.length > 0 && (
            <section>
              <SectionSubheading className="mb-6">Videos</SectionSubheading>
              <ul className="divide-y divide-border">
                {standaloneVideos.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/video/${v.slug}`}
                      className="group flex gap-6 py-7 hover:bg-surface transition-colors -mx-4 px-4 rounded"
                    >
                      <div className="shrink-0 w-36 h-24 relative overflow-hidden bg-muted rounded">
                        {v.thumbnailUrl ? (
                          <Image
                            src={v.thumbnailUrl}
                            alt={v.thumbnailAlt || v.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="144px"
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs px-1 text-center">
                            No thumbnail
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-heading text-xl group-hover:text-warm-accent transition-colors leading-snug">
                          {v.title}
                        </h2>
                        {v.description && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                            {v.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
