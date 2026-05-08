import { loadEvents } from "@/lib/events-store";
import { EventsGrid } from "./components/EventsGrid";

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
        <EventsGrid events={events} />
      )}
    </main>
  );
}
