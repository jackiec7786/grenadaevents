import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const SOURCE_URL = "https://www.go2fete.com/";

export async function scrapeGo2Fete(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "GrenadaEventsBot/1.0 (+https://example.com)" },
    cache: "no-store"
  });

  if (!res.ok) throw new Error(`Go2Fete returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();
  const events: EventItem[] = [];

  $("article, .event, .card, .event-card, [class*='event']").each((_, el) => {
    const block = $(el);
    const description = cleanText(block.text());
    if (!description || description.length < 20) return;

    const titleEl = block.find("h1, h2, h3, h4").first();
    const title = cleanText(titleEl.text()) || description.slice(0, 80);
    if (!title || title.length < 3) return;

    const link = absoluteUrl(block.find("a").first().attr("href"), SOURCE_URL);
    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(description),
      time: extractTimeText(description),
      venue: null,
      location: "Grenada",
      category: "Ticketed Event",
      description,
      source: "Go2Fete",
      url: link,
      scrapedAt
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}
