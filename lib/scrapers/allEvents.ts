import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const PAGES = [
  "https://allevents.in/st-georges/festivals",
  "https://allevents.in/st-georges/all",
];

type LdEvent = {
  "@type"?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  url?: string;
  location?: { name?: string; address?: { addressLocality?: string } };
};

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function scrapePage(url: string, scrapedAt: string): Promise<EventItem[]> {
  const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
  if (!res.ok) throw new Error(`AllEvents (${url}) returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const events: EventItem[] = [];

  // JSON-LD first
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data: LdEvent | LdEvent[] = JSON.parse($(el).html() || "");
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] !== "Event") continue;
        const title = cleanText(item.name);
        if (!title || title.length < 3) return;

        const event: EventItem = {
          id: "",
          title,
          startDate: item.startDate || null,
          endDate: item.endDate || null,
          time: extractTimeText(item.startDate || ""),
          venue: cleanText(item.location?.name) || null,
          location: cleanText(item.location?.address?.addressLocality) || "Grenada",
          category: "Festival",
          description: cleanText(item.description) || null,
          source: "AllEvents",
          url: item.url || url,
          scrapedAt,
        };
        event.id = makeEventId(event);
        events.push(event);
      }
    } catch { /* ignore */ }
  });

  if (events.length > 0) return events;

  // CSS fallback
  $("[class*='event'], [class*='card'], article").each((_, el) => {
    const block = $(el);
    const titleEl = block.find("h2, h3, h4, [class*='title'], [class*='name']").first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 3) return;

    const link = absoluteUrl(
      titleEl.find("a").attr("href") || block.find("a").first().attr("href"),
      url
    );
    // Skip cards that don't link to an actual event page on allevents.in
    if (!link.includes("allevents.in/")) return;
    if (link === url) return;

    const description = cleanText(block.text());

    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(description),
      time: extractTimeText(description),
      venue: cleanText(block.find("[class*='venue'], [class*='location']").first().text()) || null,
      location: "Grenada",
      category: "Festival",
      description,
      source: "AllEvents",
      url: link,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}

export async function scrapeAllEvents(): Promise<EventItem[]> {
  const scrapedAt = new Date().toISOString();
  const results = await Promise.allSettled(PAGES.map((p) => scrapePage(p, scrapedAt)));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
