import Link from "next/link";
import { getDb } from "@/db";
import { essays } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminEssaysPage() {
  const db = getDb();
  const all = await db
    .select()
    .from(essays)
    .orderBy(desc(essays.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Essays</h1>
        <Link
          href="/admin/essays/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New Essay
        </Link>
      </div>

      {all.length === 0 ? (
        <p className="text-muted-foreground text-sm">No essays yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {all.map((essay) => (
            <li key={essay.id} className="py-5 flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/admin/essays/${essay.id}`}
                  className="font-heading text-xl hover:text-warm-accent transition-colors"
                >
                  {essay.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(essay.createdAt).toLocaleDateString("en-CA")}
                </p>
              </div>
              <Badge variant={essay.published ? "default" : "secondary"}>
                {essay.published ? "Published" : "Draft"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
