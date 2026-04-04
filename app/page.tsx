import Link from "next/link";
import { getDb } from "@/db";
import { essays, bookReviews } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq, desc } from "drizzle-orm";
import { opEds } from "@/data/op-eds";

export default async function HomePage() {
  const db = getDb();
  const [recentEssays, recentReviews] = await Promise.all([
    db
      .select({ id: essays.id, title: essays.title, slug: essays.slug, publishedAt: essays.publishedAt })
      .from(essays)
      .where(eq(essays.published, true))
      .orderBy(desc(essays.publishedAt))
      .limit(3),
    db
      .select({ id: bookReviews.id, title: bookReviews.title, slug: bookReviews.slug, author: bookReviews.author })
      .from(bookReviews)
      .where(eq(bookReviews.published, true))
      .orderBy(desc(bookReviews.publishedAt))
      .limit(3),
  ]);

  const recentOpEds = [...opEds]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-24">
      {/* Hero */}
      <section className="mb-24 border-b border-border pb-16">
        <h1 className="font-heading text-6xl md:text-8xl tracking-wide">
          Ross Belot
        </h1>
        <p className="mt-4 text-muted-foreground text-sm tracking-widest uppercase">
          Poet &middot; Journalist &middot; Environmental Writer
        </p>
      </section>

      {/* Recent work grid */}
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
          <ul className="space-y-6">
            {recentOpEds.map((item) => (
              <li key={item.url}>
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
      </div>
    </main>
  );
}
