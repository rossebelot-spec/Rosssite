import Link from "next/link";
import { getDb } from "@/db";
import { onlineReadings } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  r2: "Video",
};

export default async function AdminOnlineReadingsPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(onlineReadings)
    .orderBy(desc(onlineReadings.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Online Readings</h1>
        <Link
          href="/admin/online-readings/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New reading
        </Link>
      </div>
      <p className="text-muted-foreground text-sm mb-8 max-w-prose">
        YouTube, TikTok, and self-hosted video appearances. Shown on the{" "}
        <Link href="/happenings?tab=readings" className="text-warm-accent hover:underline">
          Happenings → Readings
        </Link>{" "}
        tab when published.
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No readings yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((reading) => (
            <li key={reading.id} className="py-5">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <time className="text-xs tracking-widest uppercase text-muted-foreground">
                  {new Date(reading.date).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                  })}
                </time>
                <span className="text-xs tracking-widest uppercase text-warm-accent">
                  {PLATFORM_LABELS[reading.platform] ?? reading.platform}
                </span>
                <Badge variant={reading.published ? "default" : "secondary"}>
                  {reading.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <Link
                href={`/admin/online-readings/${reading.id}`}
                className="font-heading text-lg hover:text-warm-accent transition-colors line-clamp-2"
              >
                {reading.title}
              </Link>
              {reading.externalUrl && (
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">
                  {reading.externalUrl}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
