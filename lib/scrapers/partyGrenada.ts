import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const SOURCE_URL = "https://www.partygrenada.com/events-list/";

export async function scrapePartyGrenada(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "GrenadaEventsBot/1.0 (+https://example.com)" },
    cache: "no-store"
  });

  if (!res.ok) throw new Error(`Party Grenada returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();
  const events: EventItem[] = [];

  $("article, .event, .ecs-event, .tribe-events-calendar-list__event, [class*='event']").each((_, el) => {
    const block = $(el);
    const titleEl = block.find("h1, h2, h3, h4").first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 3) return;

    const link = absoluteUrl(titleEl.find("a").attr("href") || block.find("a").first().attr("href"), SOURCE_URL);
    const description = cleanText(block.text());
    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(description),
      time: extractTimeText(description),
      venue: null,
      location: "Grenada",
      category: "Nightlife / Entertainment",
      description,
      source: "Party Grenada",
      url: link,
      scrapedAt
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}
