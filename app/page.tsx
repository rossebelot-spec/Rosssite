import Link from "next/link";
import { getDb } from "@/db";
import { content, photos } from "@/db/schema";
import { eq, and, desc, notInArray } from "drizzle-orm";
import { getContentIdsLinkedToVideo } from "@/lib/content-video-links";
import { opEds } from "@/db/schema";
import { Hero } from "@/components/hero";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();
  const videoLinkedIds = await getContentIdsLinkedToVideo();
  const [recentEssays, recentReviews, heroPhotos, recentOpEdRows] = await Promise.all([
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
          eq(content.type, "essay"),
          eq(content.published, true),
          ...(videoLinkedIds.length > 0
            ? [notInArray(content.id, videoLinkedIds)]
            : [])
        )
      )
      .orderBy(desc(content.publishedAt))
      .limit(3),
    db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        author: content.topic,
      })
      .from(content)
      .where(and(eq(content.type, "review"), eq(content.published, true)))
      .orderBy(desc(content.publishedAt))
      .limit(3),
    db.select({ blobUrl: photos.blobUrl }).from(photos).where(eq(photos.isHero, true)).limit(1),
    db
      .select({
        id: opEds.id,
        title: opEds.title,
        publication: opEds.publication,
        url: opEds.url,
      })
      .from(opEds)
      .orderBy(desc(opEds.date))
      .limit(3),
  ]);

  const portraitUrl = heroPhotos[0]?.blobUrl ?? "";

  return (
    <>
      <Hero portraitUrl={portraitUrl} />

      {/* Spacer: one viewport of scroll while the fixed hero stays behind */}
      <div className="min-h-screen h-dvh shrink-0" aria-hidden="true" />

      {/* Dark content slides up over the fixed photo (curtain) */}
      <main className="relative z-10 bg-background hero-main-overlap">
        <div className="mx-auto w-full max-w-screen-xl px-6 lg:px-16 pt-8 pb-24">

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
                      {new Date(essay.publishedAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                      })}
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

        {/* Book Reviews */}
        <section>
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-6">
            Book Reviews
          </h2>
          {recentReviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">Coming soon.</p>
          ) : (
            <ul className="space-y-6">
              {recentReviews.map((review) => (
                <li key={review.id}>
                  <Link
                    href={`/book-reviews/${review.slug}`}
                    className="group block font-heading text-xl hover:text-warm-accent transition-colors"
                  >
                    {review.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{review.author}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/book-reviews"
            className="mt-8 inline-block text-xs tracking-widest uppercase text-warm-accent hover:text-foreground transition-colors"
          >
            All reviews &rarr;
          </Link>
        </section>
      </div>{/* end grid */}
        </div>{/* end inner container */}
      </main>
    </>
  );
}
