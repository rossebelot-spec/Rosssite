import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/db";
import { opEds, opEdCollections } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatPublishedDate } from "@/lib/format-published-date";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminOpEdsPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: opEds.id,
      title: opEds.title,
      url: opEds.url,
      date: opEds.date,
      publication: opEds.publication,
      thumbnailUrl: opEds.thumbnailUrl,
      published: opEds.published,
      collectionPublication: opEdCollections.publication,
    })
    .from(opEds)
    .leftJoin(opEdCollections, eq(opEds.collectionId, opEdCollections.id))
    .orderBy(desc(opEds.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Op-eds</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/op-ed-collections"
            className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
          >
            Collections
          </Link>
          <Link
            href="/admin/op-eds/new"
            className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
          >
            New Article
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No op-eds yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((item) => (
            <li key={item.id} className="py-5 flex items-center gap-4">
              {item.thumbnailUrl ? (
                <div className="relative w-20 h-14 shrink-0 bg-surface overflow-hidden rounded">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-20 h-14 shrink-0 bg-surface rounded" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <time className="text-xs tracking-widest uppercase text-muted-foreground">
                    {formatPublishedDate(new Date(item.date))}
                  </time>
                  <span className="text-xs tracking-widest uppercase text-warm-accent">
                    {item.collectionPublication ?? item.publication}
                  </span>
                  <Badge variant={item.published ? "default" : "secondary"}>
                    {item.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <Link
                  href={`/admin/op-eds/${item.id}`}
                  className="font-heading text-lg hover:text-warm-accent transition-colors line-clamp-1"
                >
                  {item.title}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
