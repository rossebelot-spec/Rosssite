import Link from "next/link";
import { getDb } from "@/db";
import {
  content,
  photos,
  videos,
  collections,
  opEdCollections,
  opEds,
  newsItems,
  siteEvents,
} from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

type StatCard = { label: string; count: number; href: string };

type StatGroup = {
  label: string;
  cards: StatCard[];
  manageHref: string;
  manageLabel: string;
};

export default async function AdminDashboard() {
  const db = getDb();
  const [
    contentRows,
    [photoCount],
    [videoCount],
    [collectionCount],
    [opEdCollectionCount],
    [opEdCount],
    [newsCount],
    [eventCount],
  ] = await Promise.all([
    db
      .select({ type: content.type, count: count() })
      .from(content)
      .groupBy(content.type),
    db.select({ count: count() }).from(photos),
    db.select({ count: count() }).from(videos),
    db.select({ count: count() }).from(collections),
    db.select({ count: count() }).from(opEdCollections),
    db.select({ count: count() }).from(opEds),
    db.select({ count: count() }).from(newsItems),
    db.select({ count: count() }).from(siteEvents),
  ]);

  const contentCounts = new Map<string, number>();
  for (const row of contentRows) {
    contentCounts.set(row.type, row.count);
  }

  const statGroups: StatGroup[] = [
    {
      label: "Multimedia",
      manageHref: "/admin/videos",
      manageLabel: "Videos →",
      cards: [
        { label: "Videos", count: videoCount.count, href: "/admin/videos" },
        {
          label: "Collections",
          count: collectionCount.count,
          href: "/admin/collections",
        },
      ],
    },
    {
      label: "Works",
      manageHref: "/admin/content",
      manageLabel: "Essays & Blog →",
      cards: [
        {
          label: "Essays",
          count: contentCounts.get("essay") ?? 0,
          href: "/admin/content?type=essay",
        },
        {
          label: "Op-eds",
          count: opEdCount.count,
          href: "/admin/op-eds",
        },
        {
          label: "Publications",
          count: opEdCollectionCount.count,
          href: "/admin/op-ed-collections",
        },
      ],
    },
    {
      label: "Photography",
      manageHref: "/admin/photography",
      manageLabel: "Photo Uploads →",
      cards: [
        { label: "Photos", count: photoCount.count, href: "/admin/photography" },
      ],
    },
    {
      label: "Happenings",
      manageHref: "/admin/news",
      manageLabel: "News →",
      cards: [
        { label: "News", count: newsCount.count, href: "/admin/news" },
        { label: "Events", count: eventCount.count, href: "/admin/events" },
      ],
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl mb-10 text-stone-900">Dashboard</h1>

      <div className="flex flex-col gap-10">
        {statGroups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center justify-between mb-4 border-b border-stone-200 pb-2">
              <p className="text-xs tracking-widest uppercase text-stone-400">
                {group.label}
              </p>
              <Link
                href={group.manageHref}
                className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
              >
                {group.manageLabel}
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {group.cards.map((stat) => (
                <Link
                  key={stat.href}
                  href={stat.href}
                  className="rounded-md p-6 bg-white border border-stone-200 hover:border-stone-400 hover:shadow-sm transition-all"
                >
                  <p className="text-2xl font-heading text-stone-900">{stat.count}</p>
                  <p className="text-xs tracking-widest uppercase text-stone-400 mt-1">
                    {stat.label}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
