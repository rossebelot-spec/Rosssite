import Link from "next/link";
import { getDb } from "@/db";
import { siteEvents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(siteEvents)
    .orderBy(desc(siteEvents.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Events</h1>
        <Link
          href="/admin/events/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New event
        </Link>
      </div>
      <p className="text-muted-foreground text-sm mb-8 max-w-prose">
        Readings, launches, and appearances on the public{" "}
        <Link href="/events" className="text-warm-accent hover:underline">
          Events
        </Link>{" "}
        page when published.
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No events yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((event) => (
            <li key={event.id} className="py-5">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <time className="text-xs tracking-widest uppercase text-muted-foreground">
                  {new Date(event.date).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <Badge variant={event.published ? "default" : "secondary"}>
                  {event.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <Link
                href={`/admin/events/${event.id}`}
                className="font-heading text-lg hover:text-warm-accent transition-colors line-clamp-2"
              >
                {event.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
