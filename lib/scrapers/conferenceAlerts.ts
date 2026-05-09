import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const SOURCE_URL = "https://www.conferencealerts.in/grenada";

export async function scrapeConferenceAlerts(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Conference Alerts returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();
  const events: EventItem[] = [];

  // Conference listing rows — typically a table or repeated div/li blocks
  $("table tr, .conf-item, .event-item, article, li").each((_, el) => {
    const block = $(el);
    const titleEl = block.find("a, h2, h3, h4, td:first-child").first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 5) return;

    const link = absoluteUrl(
      titleEl.attr("href") || block.find("a").first().attr("href"),
      SOURCE_URL
    );
    if (link === SOURCE_URL) return;

    const description = cleanText(block.text());

    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(description),
      time: extractTimeText(description),
      venue: null,
      location: "Grenada",
      category: "Conference",
      description,
      source: "Conference Alerts",
      url: link,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}
