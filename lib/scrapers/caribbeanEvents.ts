import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

// Caribbean Events — regional events aggregator with Grenada listings
const SOURCE_URL = "https://caribbeanevents.com/venue/grenada/";

export async function scrapeCaribbeanEvents(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "GrenadaEventsBot/1.0 (+https://example.com)" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Caribbean Events returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();
  const events: EventItem[] = [];

  // The Events Calendar plugin (common in this region) or generic articles
  $(
    ".tribe-events-calendar-list__event, article.type-tribe_events, article, .event-item, [class*='event']"
  ).each((_, el) => {
    const block = $(el);
    const titleEl = block
      .find(
        ".tribe-events-calendar-list__event-title a, h2 a, h3 a, h4 a, h1 a"
      )
      .first();
    const title = cleanText(titleEl.text() || block.find("h1,h2,h3,h4").first().text());
    if (!title || title.length < 3) return;

    const link = absoluteUrl(
      titleEl.attr("href") || block.find("a").first().attr("href"),
      SOURCE_URL
    );

    // Skip nav/utility elements masquerading as events
    if (!link || link === SOURCE_URL || link.includes("maps.google") || link.includes("event_tags")) return;

    const description = cleanText(block.text());

    // This is a regional site — only keep events that mention Grenada
    const combinedText = `${title} ${description}`.toLowerCase();
    if (!combinedText.includes("grenada")) return;

    const event: EventItem = {
      id: "",
      title,
      startDate:
        cleanText(
          block
            .find(".tribe-events-schedule abbr, .tribe-event-date-start")
            .first()
            .attr("title") || ""
        ) ||
        extractDateText(description) ||
        null,
      time: extractTimeText(description),
      venue:
        cleanText(
          block
            .find(".tribe-venue, .tribe-events-calendar-list__event-venue-title")
            .first()
            .text()
        ) || null,
      location: "Grenada",
      category: "Caribbean Events",
      description,
      source: "Caribbean Events",
      url: link,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}
