import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

// ilovecarnival.com — Caribbean carnival event listings for Grenada / Spicemas
const SOURCE_URL = "https://www.ilovecarnival.com/grenada-carnival-events/";

export async function scrapeIloveCarnival(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "GrenadaEventsBot/1.0 (+https://example.com)" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`ilovecarnival returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();
  const events: EventItem[] = [];

  $("article, .event, .event-item, .card, [class*='event']").each((_, el) => {
    const block = $(el);
    const titleEl = block.find("h1, h2, h3, h4, .entry-title").first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 3) return;

    const link = absoluteUrl(
      titleEl.find("a").attr("href") || block.find("a").first().attr("href"),
      SOURCE_URL
    );
    const description = cleanText(block.text());

    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(description),
      time: extractTimeText(description),
      venue:
        cleanText(block.find(".venue, .location, [class*='venue']").first().text()) || null,
      location: "Grenada",
      category: "Carnival",
      description,
      source: "ilovecarnival",
      url: link,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}
