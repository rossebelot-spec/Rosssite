import Link from "next/link";
import { getDb } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const db = getDb();

  const all = await db
    .select()
    .from(collections)
    .orderBy(asc(collections.displayOrder));

  const counts = await db
    .select({
      collectionId: collectionItems.collectionId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(collectionItems)
    .groupBy(collectionItems.collectionId);

  const countMap = new Map(counts.map((c) => [c.collectionId, c.count]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Collections</h1>
        <Link
          href="/admin/collections/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New Collection
        </Link>
      </div>

      {all.length === 0 ? (
        <p className="text-muted-foreground text-sm">No collections yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {all.map((coll) => (
            <li
              key={coll.id}
              className="py-5 flex items-start justify-between gap-4"
            >
              <div>
                <Link
                  href={`/admin/collections/${coll.id}`}
                  className="font-heading text-xl hover:text-warm-accent transition-colors"
                >
                  {coll.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {coll.slug} · {countMap.get(coll.id) ?? 0} items · order{" "}
                  {coll.displayOrder}
                </p>
              </div>
              <Badge variant={coll.published ? "default" : "secondary"}>
                {coll.published ? "Published" : "Draft"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
