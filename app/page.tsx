import Link from "next/link";
import { getDb } from "@/db";
import { content, photos, opEds } from "@/db/schema";
import { eq, and, desc, notInArray, inArray } from "drizzle-orm";
import { getContentIdsLinkedToVideo } from "@/lib/content-video-links";
import { formatPublishedMonthYear } from "@/lib/format-published-date";
import { getFeaturedHomeVideo } from "@/lib/featured-home-video";
import { Hero } from "@/components/hero";
import { HomeFeaturedVideo } from "@/components/home-featured-video";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();
  const videoLinkedIds = await getContentIdsLinkedToVideo();
  const [recentEssays, featuredVideo, heroPhotos, recentOpEdRows] = await Promise.all([
    db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        publishedAt: content.publishedAt,
      })
      .from(content)
      .where(
        and(
          inArray(content.type, ["essay", "blog"]),
          eq(content.published, true),
          ...(videoLinkedIds.length > 0
            ? [notInArray(content.id, videoLinkedIds)]
            : [])
        )
      )
      .orderBy(desc(content.publishedAt))
      .limit(3),
    getFeaturedHomeVideo(),
    db.select({ blobUrl: photos.blobUrl }).from(photos).where(eq(photos.isHero, true)).limit(1),
    db
      .select({
        id: opEds.id,
        title: opEds.title,
        publication: opEds.publication,
        url: opEds.url,
      })
      .from(opEds)
      .where(eq(opEds.published, true))
      .orderBy(desc(opEds.date))
      .limit(3),
  ]);

  const portraitUrl = heroPhotos[0]?.blobUrl ?? "";

  return (
    <>
      <Hero portraitUrl={portraitUrl} />

      <main className="relative bg-background">
        <div className="mx-auto w-full max-w-screen-xl px-6 lg:px-16 pt-12 pb-24">

          {/* ── Recent work grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

        {/* Essays */}
        <section>
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-6">
            Recent Essays
          </h2>
          {recentEssays.length === 0 ? (
            <p className="text-muted-foreground text-sm">Coming soon.</p>
          ) : (
            <ul className="space-y-6">
              {recentEssays.map((essay) => (
                <li key={essay.id}>
                  <Link
                    href={`/essays/${essay.slug}`}
                    className="group block font-heading text-xl hover:text-warm-accent transition-colors"
                  >
                    {essay.title}
                  </Link>
                  {essay.publishedAt && (
                    <time className="text-xs text-muted-foreground">
                      {formatPublishedMonthYear(new Date(essay.publishedAt))}
                    </time>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/essays"
            className="mt-8 inline-block text-xs tracking-widest uppercase text-warm-accent hover:text-foreground transition-colors"
          >
            All essays &rarr;
          </Link>
        </section>

        {/* Op-eds */}
        <section>
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-6">
            Recent Op-eds
          </h2>
          {recentOpEdRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">Coming soon.</p>
          ) : (
            <ul className="space-y-6">
              {recentOpEdRows.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block font-heading text-xl hover:text-warm-accent transition-colors"
                  >
                    {item.title}
                  </a>
                  <p className="text-xs text-muted-foreground">{item.publication}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/op-eds"
            className="mt-8 inline-block text-xs tracking-widest uppercase text-warm-accent hover:text-foreground transition-colors"
          >
            All op-eds &rarr;
          </Link>
        </section>

        {/* Featured video (slug: lib/featured-home-video.ts) */}
        <section>
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-6">
            Featured video
          </h2>
          {!featuredVideo ? (
            <p className="text-muted-foreground text-sm">Coming soon.</p>
          ) : (
            <HomeFeaturedVideo
              slug={featuredVideo.slug}
              title={featuredVideo.title}
              description={featuredVideo.description}
              vimeoId={featuredVideo.vimeoId}
              r2Url={featuredVideo.r2Url}
              thumbnailUrl={featuredVideo.thumbnailUrl}
            />
          )}
          <Link
            href="/video"
            className="mt-8 inline-block text-xs tracking-widest uppercase text-warm-accent hover:text-foreground transition-colors"
          >
            All video &rarr;
          </Link>
        </section>
      </div>{/* end grid */}
        </div>{/* end inner container */}
      </main>
    </>
  );
}
