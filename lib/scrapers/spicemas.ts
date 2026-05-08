import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

// Spicemas Corporation — official Grenada Carnival body
const PAGES = [
  "https://spicemasgrenada.com/spicemas-events/",
  "https://spicemasgrenada.com/homepage-7/spicemas-events/",
  "https://spicemasgrenada.com/events/",
];

async function fetchFirstOk(pages: string[]): Promise<{ url: string; html: string } | null> {
  for (const url of pages) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "GrenadaEventsBot/1.0 (+https://example.com)" },
        cache: "no-store",
      });
      if (res.ok) return { url, html: await res.text() };
    } catch {
      // try next URL
    }
  }
  return null;
}

export async function scrapeSpicemas(): Promise<EventItem[]> {
  const fetched = await fetchFirstOk(PAGES);
  if (!fetched) throw new Error("Spicemas: no accessible URL found");

  const { url: sourceUrl, html } = fetched;
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();
  const events: EventItem[] = [];

  // The Events Calendar plugin selectors first, then generic article fallback
  const containerSelectors = [
    ".tribe-events-calendar-list__event",
    "article.type-tribe_events",
    ".tribe-event",
    ".event-item",
    "article",
  ];

  for (const sel of containerSelectors) {
    $(sel).each((_, el) => {
      const block = $(el);
      const titleEl = block
        .find(
          ".tribe-events-calendar-list__event-title a, h2 a, h3 a, h4 a, h1 a, .tribe-event-title a"
        )
        .first();
      const title = cleanText(titleEl.text() || block.find("h1,h2,h3,h4").first().text());
      if (!title || title.length < 3) return;

      const link = absoluteUrl(
        titleEl.attr("href") || block.find("a").first().attr("href"),
        sourceUrl
      );
      const description = cleanText(block.text());

      const event: EventItem = {
        id: "",
        title,
        startDate:
          cleanText(
            block
              .find(
                ".tribe-events-schedule abbr, .tribe-event-date-start, .tribe-events-start-datetime"
              )
              .first()
              .attr("title") || ""
          ) ||
          extractDateText(description) ||
          null,
        time: extractTimeText(description),
        venue:
          cleanText(
            block.find(".tribe-venue, .tribe-events-calendar-list__event-venue-title").first().text()
          ) || null,
        location: "Grenada",
        category: "Carnival / Spicemas",
        description,
        source: "Spicemas",
        url: link,
        scrapedAt,
      };
      event.id = makeEventId(event);
      events.push(event);
    });

    if (events.length > 0) break;
  }

  return events;
}
