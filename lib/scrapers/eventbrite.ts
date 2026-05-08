import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

// Slug specifically targets Saint George's, Grenada (W.I.) — not Grenada, Mississippi
const SOURCE_URL = "https://www.eventbrite.com/d/grenada--saint-georges/events/";

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

const GRENADA_TERMS = ["grenada", "saint george", "st. george", "st george", "spicemas", "spice mas"];

function isGrenada(text: string): boolean {
  const lower = text.toLowerCase();
  return GRENADA_TERMS.some((t) => lower.includes(t));
}

function parseJsonLd($: cheerio.CheerioAPI, scrapedAt: string): EventItem[] {
  const events: EventItem[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data: LdEvent | LdEvent[] = JSON.parse($(el).html() || "");
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item["@type"] !== "Event") continue;
        const title = cleanText(item.name);
        if (!title || title.length < 3) continue;

        const url = item.url;
        if (!url || url === SOURCE_URL) continue;

        const locality = cleanText(item.location?.address?.addressLocality);
        const country = cleanText(item.location?.address?.addressCountry);
        const venue = cleanText(item.location?.name);
        const locationStr = `${locality} ${country} ${venue}`;

        // Drop events with an explicit non-Grenada location
        if (locationStr.trim() && !isGrenada(`${locationStr} ${title}`)) continue;

        const event: EventItem = {
          id: "",
          title,
          startDate: item.startDate || extractDateText(cleanText(item.description || "")) || null,
          endDate: item.endDate || null,
          time: extractTimeText(item.startDate || ""),
          venue: venue || null,
          location: locality || country || "Grenada",
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
      // ignore malformed JSON-LD
    }
  });

  return events;
}

export async function scrapeEventbrite(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Eventbrite returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();

  const ldEvents = parseJsonLd($, scrapedAt);
  if (ldEvents.length > 0) return ldEvents;

  // CSS fallback
  const events: EventItem[] = [];

  $(
    ".event-card, [data-event-id], .eds-event-card, .search-event-card-wrapper, article"
  ).each((_, el) => {
    const block = $(el);
    const titleEl = block
      .find(".event-card__title, .eds-event-card__formatted-name, h2, h3")
      .first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 3) return;

    const link = absoluteUrl(block.find("a").first().attr("href"), SOURCE_URL);
    if (link === SOURCE_URL) return;

    const description = cleanText(block.text());
    if (!isGrenada(`${title} ${description}`)) return;

    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(description),
      time: extractTimeText(description),
      venue: cleanText(block.find(".event-card__venue").first().text()) || null,
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
