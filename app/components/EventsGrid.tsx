"use client";

import { useEffect, useState } from "react";
import { EventItem } from "@/lib/types";

const STORAGE_KEY = "hidden-events";
const NEWS_CATEGORY = "News";

function trimDescription(value?: string | null): string | null {
  if (!value) return null;
  return value.length > 220 ? `${value.slice(0, 220)}…` : value;
}

function EventCard({
  event,
  onHide,
}: {
  event: EventItem;
  onHide: () => void;
}) {
  const description = trimDescription(event.description);

  return (
    <article className="card">
      <div className="cardHeader">
        <h2>{event.title}</h2>
        <button className="hideBtn" onClick={onHide} aria-label="Remove event">
          ×
        </button>
      </div>
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

function NewsItem({
  event,
  onHide,
}: {
  event: EventItem;
  onHide: () => void;
}) {
  return (
    <li className="newsItem">
      <div className="newsItemInner">
        <div className="newsItemContent">
          {event.startDate && (
            <span className="newsDate">{event.startDate}</span>
          )}
          <a
            className="newsTitle"
            href={event.url}
            target="_blank"
            rel="noreferrer"
          >
            {event.title}
          </a>
          {event.description && (
            <p className="newsSnippet">{trimDescription(event.description)}</p>
          )}
        </div>
        <button
          className="hideBtn"
          onClick={onHide}
          aria-label="Remove article"
        >
          ×
        </button>
      </div>
    </li>
  );
}

export function EventsGrid({ events }: { events: EventItem[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHidden(new Set(JSON.parse(stored) as string[]));
    } catch {
      // ignore
    }
  }, []);

  const hide = (id: string) => {
    const next = new Set([...hidden, id]);
    setHidden(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // ignore
    }
  };

  const eventItems = events.filter((e) => e.category !== NEWS_CATEGORY);
  const newsItems = events.filter((e) => e.category === NEWS_CATEGORY);

  const categories = [
    "All",
    ...Array.from(new Set(eventItems.map((e) => e.category ?? "Other"))).sort(),
  ];

  const visibleEvents = eventItems.filter(
    (e) =>
      !hidden.has(e.id) &&
      (activeFilter === "All" || e.category === activeFilter)
  );

  const visibleNews = newsItems.filter((e) => !hidden.has(e.id));

  return (
    <>
      <div className="filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filterBtn${activeFilter === cat ? " filterBtn--active" : ""}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {visibleEvents.length === 0 ? (
        <div className="empty">No events match this filter.</div>
      ) : (
        <section className="grid">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} onHide={() => hide(event.id)} />
          ))}
        </section>
      )}

      {visibleNews.length > 0 && (
        <section className="newsSection">
          <h2 className="newsSectionTitle">Related News</h2>
          <ul className="newsList">
            {visibleNews.map((item) => (
              <NewsItem key={item.id} event={item} onHide={() => hide(item.id)} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
