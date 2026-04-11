import Link from "next/link";
import { getDb } from "@/db";
import {
  content,
  photos,
  videoPoems,
  collections,
  type ContentType,
} from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

const sections = [
  { label: "Content", href: "/admin/content" },
  { label: "Photography", href: "/admin/photography" },
  { label: "Video Poems", href: "/admin/video-poems" },
  { label: "Collections", href: "/admin/collections" },
  { label: "Op-eds", href: "/admin/op-eds" },
  { label: "Press", href: "/admin/press" },
  { label: "Events", href: "/admin/events" },
];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  essay: "Essays",
  blog: "Blog",
  review: "Reviews",
  news: "News",
  event: "Events",
};

const CONTENT_TYPE_ORDER: ContentType[] = [
  "essay",
  "blog",
  "review",
  "news",
  "event",
];

export default async function AdminDashboard() {
  const db = getDb();
  const [contentRows, [photoCount], [videoPoemCount], [collectionCount]] =
    await Promise.all([
      db
        .select({ type: content.type, count: count() })
        .from(content)
        .groupBy(content.type),
      db.select({ count: count() }).from(photos),
      db.select({ count: count() }).from(videoPoems),
      db.select({ count: count() }).from(collections),
    ]);

  const contentCounts = new Map<string, number>();
  for (const row of contentRows) {
    contentCounts.set(row.type, row.count);
  }

  const contentStats = CONTENT_TYPE_ORDER.map((type) => ({
    label: CONTENT_TYPE_LABELS[type],
    count: contentCounts.get(type) ?? 0,
    href: `/admin/content?type=${type}`,
  }));

  const stats = [
    ...contentStats,
    { label: "Photos", count: photoCount.count, href: "/admin/photography" },
    {
      label: "Video Poems",
      count: videoPoemCount.count,
      href: "/admin/video-poems",
    },
    {
      label: "Collections",
      count: collectionCount.count,
      href: "/admin/collections",
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="border border-border rounded-md p-6 bg-surface hover:border-warm-accent transition-colors"
          >
            <p className="text-2xl font-heading">{stat.count}</p>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mt-1">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="border border-border rounded-md px-5 py-4 text-sm tracking-widest uppercase hover:text-warm-accent hover:border-warm-accent transition-colors"
          >
            {section.label} &rarr;
          </Link>
        ))}
      </div>
    </div>
  );
}
