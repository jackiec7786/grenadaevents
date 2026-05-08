import { ScrapeResult, EventItem } from "@/lib/types";

const EMPTY: ScrapeResult & { storage?: string } = {
  count: 0,
  events: [],
  errors: [],
  scrapedAt: "",
};

async function getEvents(): Promise<ScrapeResult & { storage?: string }> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/events`, { cache: "no-store" });
    if (!res.ok) return EMPTY;
    return res.json();
  } catch {
    return EMPTY;
  }
}

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
  const data = await getEvents();
  const events = data.events ?? [];

  return (
    <main className="page">
      <section className="hero">
        <h1>Grenada Events</h1>
        <p>
          Public event listings collected from selected Grenada event sources. This app is designed for Vercel hosting with an API route and scheduled cron scraping.
        </p>
      </section>

      <div className="toolbar">
        <span className="badge">{events.length} events found</span>
        <span className="badge">Last scraped: {data.scrapedAt ? new Date(data.scrapedAt).toLocaleString() : "Not yet"}</span>
        <span className="badge">Storage: {data.storage ?? "response"}</span>
      </div>

      {data.errors?.length > 0 && (
        <div className="empty">
          Some sources failed: {data.errors.join("; ")}
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty">
          No events found yet. Try visiting <code>/api/scrape</code> or check the scraper selectors.
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
