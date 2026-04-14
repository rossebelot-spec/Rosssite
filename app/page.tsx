import Link from "next/link";
import { getDb } from "@/db";
import { photos, opEds, newsItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatPublishedMonthYear } from "@/lib/format-published-date";
import { getFeaturedHomeVideo } from "@/lib/featured-home-video";
import { Hero } from "@/components/hero";
import { HomeFeaturedVideoCopy } from "@/components/home-featured-video";
import { websiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();
  const featuredPromise = getFeaturedHomeVideo();
  const heroPhotosPromise = db
    .select({ blobUrl: photos.blobUrl })
    .from(photos)
    .where(eq(photos.isHero, true))
    .limit(1);
  const opEdRowsPromise = db
    .select({
      id: opEds.id,
      title: opEds.title,
      publication: opEds.publication,
      url: opEds.url,
    })
    .from(opEds)
    .where(eq(opEds.published, true))
    .orderBy(desc(opEds.date))
    .limit(3);
  const newsRowsPromise = db
    .select({
      id: newsItems.id,
      title: newsItems.title,
      date: newsItems.date,
      url: newsItems.url,
      kind: newsItems.kind,
      slug: newsItems.slug,
    })
    .from(newsItems)
    .where(eq(newsItems.published, true))
    .orderBy(desc(newsItems.date))
    .limit(3);

  const [featuredVideo, heroPhotos, recentOpEdRows, recentNewsRows] = await Promise.all([
    featuredPromise,
    heroPhotosPromise,
    opEdRowsPromise,
    newsRowsPromise,
  ]);

  const portraitUrl = heroPhotos[0]?.blobUrl ?? "";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
      <Hero
        portraitUrl={portraitUrl}
        featuredVideo={
          featuredVideo
            ? {
                title: featuredVideo.title,
                slug: featuredVideo.slug,
                vimeoId: featuredVideo.vimeoId,
                r2Url: featuredVideo.r2Url,
                thumbnailUrl: featuredVideo.thumbnailUrl,
              }
            : null
        }
      />

      <main className="relative bg-background">
        <div className="mx-auto w-full max-w-screen-xl px-6 lg:px-16 pt-12 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* News */}
            <section>
              <h2 className="text-sm md:text-base font-medium tracking-widest uppercase text-muted-foreground mb-6">
                Recent news
              </h2>
              {recentNewsRows.length === 0 ? (
                <p className="text-muted-foreground text-sm">Coming soon.</p>
              ) : (
                <ul className="space-y-6">
                  {recentNewsRows.map((item) => {
                    const href =
                      item.kind === "story" && item.slug
                        ? `/news/${item.slug}`
                        : item.url ?? null;
                    const titleEl = (
                      <span className="font-heading text-xl group-hover:text-warm-accent transition-colors">
                        {item.title}
                      </span>
                    );
                    const dateEl = item.date ? (
                      <time className="text-xs text-muted-foreground block mt-1">
                        {formatPublishedMonthYear(new Date(item.date + "T12:00:00"))}
                      </time>
                    ) : null;
                    return (
                      <li key={item.id}>
                        {href ? (
                          href.startsWith("/") ? (
                            <Link href={href} className="group block">
                              {titleEl}
                              {dateEl}
                            </Link>
                          ) : (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block"
                            >
                              {titleEl}
                              {dateEl}
                            </a>
                          )
                        ) : (
                          <div className="block">
                            <span className="font-heading text-xl">{item.title}</span>
                            {dateEl}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href="/happenings"
                className="mt-8 inline-block text-xs tracking-widest uppercase text-warm-accent hover:text-foreground transition-colors"
              >
                Happenings &rarr;
              </Link>
            </section>

            {/* Commentary & analysis (op-eds route) */}
            <section>
              <h2 className="text-sm md:text-base font-medium tracking-widest uppercase text-muted-foreground mb-6">
                Recent commentary & analysis
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
                All commentary & analysis &rarr;
              </Link>
            </section>

            {/* Featured video */}
            <section>
              <h2 className="text-sm md:text-base font-medium tracking-widest uppercase text-muted-foreground mb-6">
                Featured video
              </h2>
              {!featuredVideo ? (
                <p className="text-muted-foreground text-sm">Coming soon.</p>
              ) : (
                <HomeFeaturedVideoCopy
                  slug={featuredVideo.slug}
                  title={featuredVideo.title}
                  description={featuredVideo.description}
                />
              )}
              <Link
                href="/multimedia"
                className="mt-8 inline-block text-xs tracking-widest uppercase text-warm-accent hover:text-foreground transition-colors"
              >
                All multimedia &rarr;
              </Link>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
