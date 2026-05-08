import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const SOURCE_URL = "https://www.puregrenada.com/events/category/festivals-culture/";

export async function scrapePureGrenada(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "GrenadaEventsBot/1.0 (+https://example.com)" },
    cache: "no-store"
  });

  if (!res.ok) throw new Error(`Pure Grenada returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();
  const events: EventItem[] = [];

  $(".tribe-events-calendar-list__event, article, .type-tribe_events").each((_, el) => {
    const block = $(el);
    const titleEl = block.find("h1, h2, h3, h4, .tribe-events-calendar-list__event-title").first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 3) return;

    const link = absoluteUrl(titleEl.find("a").attr("href") || block.find("a").first().attr("href"), SOURCE_URL);
    const description = cleanText(block.text());
    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(description),
      time: extractTimeText(description),
      venue: cleanText(block.find(".tribe-events-calendar-list__event-venue-title, .tribe-venue").first().text()) || null,
      location: "Grenada",
      category: "Festival / Culture",
      description,
      source: "Pure Grenada",
      url: link,
      scrapedAt
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}
