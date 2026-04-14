import Link from "next/link";
import { getDb } from "@/db";
import { pressItems } from "@/db/schema";
import { desc } from "drizzle-orm";
import { formatPublishedDate } from "@/lib/format-published-date";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminPressPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(pressItems)
    .orderBy(desc(pressItems.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Press</h1>
        <Link
          href="/admin/press/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New entry
        </Link>
      </div>
      <p className="text-muted-foreground text-sm mb-8 max-w-prose">
        Clippings and links appear on the public{" "}
        <Link href="/press" className="text-warm-accent hover:underline">
          Press
        </Link>{" "}
        page when marked published (same pattern as op-eds).
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No press entries yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((item) => (
            <li key={item.id} className="py-5">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <time className="text-xs tracking-widest uppercase text-muted-foreground">
                  {formatPublishedDate(new Date(item.date))}
                </time>
                <span className="text-xs tracking-widest uppercase text-warm-accent">
                  {item.outlet}
                </span>
                <Badge variant={item.published ? "default" : "secondary"}>
                  {item.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <Link
                href={`/admin/press/${item.id}`}
                className="font-heading text-lg hover:text-warm-accent transition-colors line-clamp-2"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
