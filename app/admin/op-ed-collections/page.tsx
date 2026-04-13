import Link from "next/link";
import { getDb } from "@/db";
import { opEdCollections, opEds } from "@/db/schema";
import { asc, eq, count } from "drizzle-orm";
import { OpEdMastheadImg } from "@/components/op-ed-masthead-img";
import { resolveOpEdCollectionMastheadUrl } from "@/lib/op-ed-masthead";

export const dynamic = "force-dynamic";

export default async function AdminOpEdCollectionsPage() {
  const db = getDb();
  const colls = await db
    .select({
      id: opEdCollections.id,
      publication: opEdCollections.publication,
      slug: opEdCollections.slug,
      mastheadUrl: opEdCollections.mastheadUrl,
      displayOrder: opEdCollections.displayOrder,
      articleCount: count(opEds.id),
    })
    .from(opEdCollections)
    .leftJoin(opEds, eq(opEds.collectionId, opEdCollections.id))
    .groupBy(opEdCollections.id)
    .orderBy(asc(opEdCollections.displayOrder), asc(opEdCollections.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Op-ed Collections</h1>
        <Link
          href="/admin/op-ed-collections/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New Collection
        </Link>
      </div>

      {colls.length === 0 ? (
        <p className="text-muted-foreground text-sm">No collections yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {colls.map((coll) => {
            const mastheadSrc = resolveOpEdCollectionMastheadUrl(
              coll.slug,
              coll.mastheadUrl
            );
            return (
              <li key={coll.id} className="py-5 flex items-center gap-4">
                {mastheadSrc ? (
                  <div className="flex h-10 w-32 shrink-0 items-center justify-center rounded border border-border bg-white p-1">
                    <OpEdMastheadImg
                      src={mastheadSrc}
                      alt={coll.publication}
                      width={120}
                      height={32}
                      className="max-h-8 w-auto max-w-full object-contain"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/op-ed-collections/${coll.id}`}
                    className="font-heading text-xl hover:text-warm-accent transition-colors"
                  >
                    {coll.publication}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    {coll.slug} · {coll.articleCount}{" "}
                    {coll.articleCount === 1 ? "article" : "articles"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
