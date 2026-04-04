import type { Metadata } from "next";
import { events } from "@/data/events";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = events
    .filter((e) => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const EventItem = ({ event }: { event: (typeof events)[0] }) => (
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
      {event.description && (
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          {event.description}
        </p>
      )}
    </li>
  );

  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader title="Events" />

      {upcoming.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
            Upcoming
          </h2>
          <ul className="divide-y divide-border">
            {upcoming.map((event, i) => (
              <EventItem key={i} event={event} />
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
            Past
          </h2>
          <ul className="divide-y divide-border">
            {past.map((event, i) => (
              <EventItem key={i} event={event} />
            ))}
          </ul>
        </section>
      )}

      {events.length === 0 && (
        <p className="text-muted-foreground text-sm">No events yet.</p>
      )}
    </main>
  );
}
