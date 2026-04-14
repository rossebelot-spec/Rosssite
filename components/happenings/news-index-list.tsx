import Link from "next/link";
import { getDb } from "@/db";
import { newsItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/** Shared list body for `/news` and Happenings → News tab. */
export async function NewsIndexList() {
  const db = getDb();
  const rows = await db
    .select()
    .from(newsItems)
    .where(eq(newsItems.published, true))
    .orderBy(desc(newsItems.date));

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">No news yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((item) => {
        const kindLabel =
          item.kind === "story"
            ? "Story"
            : item.kind === "announcement"
              ? "Announcement"
              : "Coverage";
        const storyLink =
          item.kind === "story" && item.slug ? `/news/${item.slug}` : null;
        return (
          <li key={item.id} className="py-6">
            <div className="flex items-baseline gap-4 flex-wrap">
              <time className="text-xs tracking-widest uppercase text-muted-foreground shrink-0">
                {new Date(item.date).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "long",
                })}
              </time>
              <span className="text-xs tracking-widest uppercase text-warm-accent">
                {kindLabel}
                {item.outlet ? ` · ${item.outlet}` : ""}
              </span>
            </div>
            {storyLink ? (
              <Link
                href={storyLink}
                className="font-heading text-xl mt-1 block hover:text-warm-accent transition-colors"
              >
                {item.title}
              </Link>
            ) : item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-heading text-xl mt-1 block hover:text-warm-accent transition-colors"
              >
                {item.title}
              </a>
            ) : (
              <p className="font-heading text-xl mt-1">{item.title}</p>
            )}
            {item.description ? (
              <p className="text-muted-foreground text-sm mt-2 max-w-prose leading-relaxed">
                {item.description}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
