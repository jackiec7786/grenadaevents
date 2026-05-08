import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const SOURCE_URL = "https://nowgrenada.com/category/events/";

export async function scrapeNowGrenada(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "GrenadaEventsBot/1.0 (+https://example.com)" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Now Grenada returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();
  const events: EventItem[] = [];

  $("article").each((_, el) => {
    const block = $(el);
    const titleEl = block.find(".entry-title a, h2 a, h3 a, h1 a").first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 3) return;

    const link = absoluteUrl(
      titleEl.attr("href") || block.find("a").first().attr("href"),
      SOURCE_URL
    );

    const dateEl = block.find("time[datetime], .entry-date, .posted-on time").first();
    const startDate =
      dateEl.attr("datetime") ||
      cleanText(dateEl.text()) ||
      extractDateText(cleanText(block.text()));

    const description = cleanText(
      block.find(".entry-summary, .entry-content, .entry-excerpt").first().text()
    ) || cleanText(block.text()).slice(0, 400);

    const event: EventItem = {
      id: "",
      title,
      startDate: startDate || null,
      time: extractTimeText(description),
      venue: null,
      location: "Grenada",
      category: "Events",
      description,
      source: "Now Grenada",
      url: link,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}
