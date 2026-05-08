import { loadEvents } from "@/lib/events-store";
import { EventItem } from "@/lib/types";

function trimDescription(value?: string | null): string | null {
  if (!value) return null;
  return value.length > 220 ? `${value.slice(0, 220)}…` : value;
}

function EventCard({ event }: { event: EventItem }) {
  const description = trimDescription(event.description);

  return (
    <article className="card">
      <h2>{event.title}</h2>
      <div className="meta">
        {event.startDate && <div>Date: {event.startDate}</div>}
        {event.time && <div>Time: {event.time}</div>}
        {event.venue && <div>Venue: {event.venue}</div>}
        {event.category && <div>Category: {event.category}</div>}
      </div>
      {description && <p className="description">{description}</p>}
      <div className="cardFooter">
        <span className="source">{event.source}</span>
        <a className="button" href={event.url} target="_blank" rel="noreferrer">
          View event
        </a>
      </div>
    </article>
  );
}

export default async function Home() {
  const stored = await loadEvents().catch(() => null);
  const events = stored?.events ?? [];

  return (
    <main className="page">
      <section className="hero">
        <h1>Grenada Events</h1>
        <p>
          Public event listings collected from selected Grenada event sources.
          This app is designed for Vercel hosting with an API route and scheduled cron scraping.
        </p>
      </section>

      <div className="toolbar">
        <span className="badge">{events.length} events found</span>
        <span className="badge">
          Last scraped:{" "}
          {stored?.scrapedAt ? new Date(stored.scrapedAt).toLocaleString() : "Not yet"}
        </span>
        <span className="badge">Storage: {stored ? "blob" : "none"}</span>
      </div>

      {(stored?.errors?.length ?? 0) > 0 && (
        <div className="empty">
          Some sources failed: {stored!.errors.join("; ")}
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty">
          No events found yet. Visit <code>/api/scrape</code> to populate the event list.
        </div>
      ) : (
        <section className="grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>
      )}
    </main>
  );
}
