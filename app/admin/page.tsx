import Link from "next/link";
import { getDb } from "@/db";
import { essays, bookReviews, photos } from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

const sections = [
  { label: "Essays", href: "/admin/essays" },
  { label: "Book Reviews", href: "/admin/book-reviews" },
  { label: "Photography", href: "/admin/photography" },
  { label: "Op-eds", href: "/admin/op-eds" },
  { label: "Press", href: "/admin/press" },
  { label: "Events", href: "/admin/events" },
];

export default async function AdminDashboard() {
  const db = getDb();
  const [[essayCount], [reviewCount], [photoCount]] = await Promise.all([
    db.select({ count: count() }).from(essays),
    db.select({ count: count() }).from(bookReviews),
    db.select({ count: count() }).from(photos),
  ]);

  const stats = [
    { label: "Essays", count: essayCount.count, href: "/admin/essays" },
    { label: "Book Reviews", count: reviewCount.count, href: "/admin/book-reviews" },
    { label: "Photos", count: photoCount.count, href: "/admin/photography" },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-12">
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
