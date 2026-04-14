import {
  SectionHeader,
  SectionSubheading,
} from "@/components/section-header";
import { getDb } from "@/db";
import { siteEvents, type SiteEventRow } from "@/db/schema";
import { eq } from "drizzle-orm";

function EventItem({ event }: { event: SiteEventRow }) {
  return (
    <li className="py-6">
      <time className="text-xs tracking-widest uppercase text-muted-foreground">
        {new Date(event.date).toLocaleDateString("en-CA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
      {event.link ? (
        <a
          href={event.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading text-xl mt-1 block hover:text-warm-accent transition-colors"
        >
          {event.title}
        </a>
      ) : (
        <p className="font-heading text-xl mt-1">{event.title}</p>
      )}
      <p className="text-xs tracking-widest uppercase text-muted-foreground mt-1">
        {event.location}
      </p>
      {event.description ? (
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          {event.description}
        </p>
      ) : null}
    </li>
  );
}

async function loadEvents() {
  const db = getDb();
  return db
    .select()
    .from(siteEvents)
    .where(eq(siteEvents.published, true));
}

type Props = {
  /** When true, include page title (for standalone `/events`). */
  withPageHeader?: boolean;
};

/** Shared calendar body for `/events` and Happenings → Events tab. */
export async function SiteEventsIndex({ withPageHeader = false }: Props) {
  const rows = await loadEvents();

  const now = new Date();
  const upcoming = rows
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = rows
    .filter((e) => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const body =
    rows.length === 0 ? (
      <p className="text-muted-foreground text-sm">No events yet.</p>
    ) : (
      <>
        {upcoming.length > 0 && (
          <section className="mb-12">
            <SectionSubheading className="mb-4">Upcoming</SectionSubheading>
            <ul className="divide-y divide-border">
              {upcoming.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </ul>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <SectionSubheading className="mb-4">Past</SectionSubheading>
            <ul className="divide-y divide-border">
              {past.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </ul>
          </section>
        )}
      </>
    );

  if (withPageHeader) {
    return (
      <>
        <SectionHeader title="Events" />
        {body}
      </>
    );
  }

  return body;
}
