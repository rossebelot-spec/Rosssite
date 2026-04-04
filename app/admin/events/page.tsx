import { events } from "@/data/events";

export default function AdminEventsPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl mb-8">Events</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Edit{" "}
        <code className="text-xs bg-surface px-1 py-0.5 rounded">data/events.ts</code>{" "}
        to add or remove events.
      </p>
      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">No events yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((event, i) => (
            <li key={i} className="py-4">
              <p className="font-heading text-lg">{event.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(event.date).toLocaleDateString("en-CA")} &middot; {event.location}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
