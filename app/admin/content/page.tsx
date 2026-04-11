import Link from "next/link";
import { getDb } from "@/db";
import { content, type ContentType } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const TYPE_FILTERS: { label: string; value: ContentType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Essay", value: "essay" },
  { label: "Blog", value: "blog" },
  { label: "Review", value: "review" },
  { label: "News", value: "news" },
  { label: "Event", value: "event" },
];

const VALID_TYPES = new Set<ContentType>([
  "essay",
  "blog",
  "review",
  "news",
  "event",
]);

function isContentType(value: string | undefined): value is ContentType {
  return !!value && VALID_TYPES.has(value as ContentType);
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = isContentType(type) ? type : "all";

  const db = getDb();
  const rows = await (isContentType(type)
    ? db
        .select()
        .from(content)
        .where(eq(content.type, type))
        .orderBy(desc(content.createdAt))
    : db.select().from(content).orderBy(desc(content.createdAt)));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Content</h1>
        <Link
          href="/admin/content/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New Content
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2 mb-6">
        {TYPE_FILTERS.map((filter) => {
          const href =
            filter.value === "all"
              ? "/admin/content"
              : `/admin/content?type=${filter.value}`;
          const isActive = activeType === filter.value;
          return (
            <Link
              key={filter.value}
              href={href}
              className={
                isActive
                  ? "text-xs tracking-widest uppercase px-3 py-1.5 border border-warm-accent text-warm-accent transition-colors"
                  : "text-xs tracking-widest uppercase px-3 py-1.5 border border-border text-muted-foreground hover:border-warm-accent hover:text-warm-accent transition-colors"
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No content yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li
              key={row.id}
              className="py-5 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/content/${row.id}`}
                  className="font-heading text-xl hover:text-warm-accent transition-colors"
                >
                  {row.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {row.topic ? `${row.topic} · ` : ""}
                  {new Date(row.createdAt).toLocaleDateString("en-CA")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline">{row.type}</Badge>
                <Badge variant={row.published ? "default" : "secondary"}>
                  {row.published ? "Published" : "Draft"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
