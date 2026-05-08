import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const SOURCE_URL = "https://www.eventbrite.com/d/grenada/events/";

type LdEvent = {
  "@type"?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  url?: string;
  location?: {
    name?: string;
    address?: { addressLocality?: string; addressCountry?: string };
  };
};

function parseJsonLd($: cheerio.CheerioAPI, scrapedAt: string): EventItem[] {
  const events: EventItem[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() || "";
      const data: LdEvent | LdEvent[] = JSON.parse(raw);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item["@type"] !== "Event") continue;
        const title = cleanText(item.name);
        if (!title || title.length < 3) continue;

        // Skip events without an individual URL — they have no actionable data
        const url = item.url;
        if (!url || url === SOURCE_URL) continue;

        const location = cleanText(item.location?.address?.addressLocality) ||
          cleanText(item.location?.address?.addressCountry) || "Grenada";

        const event: EventItem = {
          id: "",
          title,
          startDate: item.startDate || extractDateText(cleanText(item.description || "")) || null,
          endDate: item.endDate || null,
          time: extractTimeText(item.startDate || ""),
          venue: cleanText(item.location?.name) || null,
          location,
          category: "Ticketed Event",
          description: cleanText(item.description) || null,
          source: "Eventbrite",
          url,
          scrapedAt,
        };
        event.id = makeEventId(event);
        events.push(event);
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  });

  return events;
}

export async function scrapeEventbrite(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "GrenadaEventsBot/1.0 (+https://example.com)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Eventbrite returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();

  // JSON-LD is the most reliable signal on Eventbrite pages
  const ldEvents = parseJsonLd($, scrapedAt);
  if (ldEvents.length > 0) return ldEvents;

    // CSS fallback for when JSON-LD is absent
  const events: EventItem[] = [];

  $(
    ".event-card, [data-event-id], .eds-event-card, .search-event-card-wrapper, article"
  ).each((_, el) => {
    const block = $(el);
    const titleEl = block
      .find(
        ".event-card__title, .eds-event-card__formatted-name, .eds-event-card--consumer__title, h2, h3"
      )
      .first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 3) return;

    const link = absoluteUrl(block.find("a").first().attr("href"), SOURCE_URL);
    // Skip items that only link back to the listing page — they have no real event URL
    if (link === SOURCE_URL) return;

    const description = cleanText(block.text());

    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(description),
      time: extractTimeText(description),
      venue:
        cleanText(block.find(".event-card__venue, [data-venue-name]").first().text()) || null,
      location: "Grenada",
      category: "Ticketed Event",
      description,
      source: "Eventbrite",
      url: link,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}
