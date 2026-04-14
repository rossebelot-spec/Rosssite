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
        description="Video and photography collections. Each collection is labelled as video or photo."
      />

      {published.length === 0 && standaloneVideos.length === 0 ? (
        <p className="text-muted-foreground text-sm">No multimedia yet.</p>
      ) : (
        <div className="space-y-16">
          {published.length > 0 && (
            <section>
              <SectionSubheading className="mb-6">Collections</SectionSubheading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {published.map((coll) => (
                  <Link
                    key={coll.id}
                    href={`/video/collections/${coll.slug}`}
                    className="group flex flex-col gap-3"
                  >
                    {coll.coverImageUrl ? (
                      <div className="relative aspect-video bg-surface overflow-hidden rounded">
                        <Image
                          src={coll.coverImageUrl}
                          alt={coll.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-surface rounded flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No cover</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs tracking-widest uppercase text-warm-accent mb-1">
                        {collectionKindLabel(coll.mediaType)}
                      </p>
                      <p className="font-heading text-lg group-hover:text-warm-accent transition-colors">
                        {coll.title}
                      </p>
                      {coll.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {coll.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {standaloneVideos.length > 0 && (
            <section>
              <SectionSubheading className="mb-6">Videos</SectionSubheading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {standaloneVideos.map((v) => (
                  <Link
                    key={v.id}
                    href={`/video/${v.slug}`}
                    className="group flex flex-col gap-3"
                  >
                    {v.thumbnailUrl ? (
                      <div className="relative aspect-video bg-surface overflow-hidden rounded">
                        <Image
                          src={v.thumbnailUrl}
                          alt={v.thumbnailAlt || v.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-surface rounded flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No thumbnail</span>
                      </div>
                    )}
                    <div>
                      <p className="font-heading text-lg group-hover:text-warm-accent transition-colors">
                        {v.title}
                      </p>
                      {v.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {v.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
