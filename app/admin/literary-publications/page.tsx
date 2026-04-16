import Link from "next/link";
import { getDb } from "@/db";
import { literaryPublications } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  journal: "Journal",
  anthology: "Anthology",
  translation: "Translation",
  prize: "Prize",
  award: "Award",
};

export default async function AdminLiteraryPublicationsPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(literaryPublications)
    .orderBy(desc(literaryPublications.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Literary Publications</h1>
        <Link
          href="/admin/literary-publications/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New entry
        </Link>
      </div>
      <p className="text-muted-foreground text-sm mb-8 max-w-prose">
        Journal appearances, anthology inclusions, translations, prize shortlists, and
        awards shown in the In Print section of{" "}
        <Link href="/literary" className="text-warm-accent hover:underline">
          /literary
        </Link>
        .
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((pub) => (
            <li key={pub.id} className="py-5">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <time className="text-xs tracking-widest uppercase text-muted-foreground">
                  {pub.date}
                </time>
                <Badge variant="outline">
                  {KIND_LABELS[pub.kind] ?? pub.kind}
                </Badge>
                <Badge variant={pub.published ? "default" : "secondary"}>
                  {pub.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <Link
                href={`/admin/literary-publications/${pub.id}`}
                className="font-heading text-lg hover:text-warm-accent transition-colors"
              >
                {pub.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-1">{pub.publication}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
