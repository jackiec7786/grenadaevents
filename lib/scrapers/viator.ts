import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { absoluteUrl, cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const SOURCE_URL = "https://www.viator.com/St-Georges/d50254-ttd";

type LdProduct = {
  "@type"?: string;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
};

function parseJsonLd($: cheerio.CheerioAPI, scrapedAt: string): EventItem[] {
  const events: EventItem[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data: LdProduct | LdProduct[] = JSON.parse($(el).html() || "");
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (
          item["@type"] !== "Product" &&
          item["@type"] !== "Event" &&
          item["@type"] !== "TouristAttraction"
        )
          continue;
        const title = cleanText(item.name);
        if (!title || title.length < 3) continue;

        const event: EventItem = {
          id: "",
          title,
          startDate: null,
          time: null,
          venue: "St. George's, Grenada",
          location: "Grenada",
          category: "Tours & Activities",
          description: cleanText(item.description) || null,
          source: "Viator",
          url: item.url || SOURCE_URL,
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

export async function scrapeViator(): Promise<EventItem[]> {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Viator returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const scrapedAt = new Date().toISOString();

  const ldEvents = parseJsonLd($, scrapedAt);
  if (ldEvents.length > 0) return ldEvents;

  // CSS fallback
  const events: EventItem[] = [];

  $("[class*='product'], [class*='activity'], [class*='card'], article").each((_, el) => {
    const block = $(el);
    const titleEl = block.find("h2, h3, h4").first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 3) return;

    const link = absoluteUrl(block.find("a").first().attr("href"), SOURCE_URL);
    const description = cleanText(block.text());

    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(description),
      time: extractTimeText(description),
      venue: "St. George's, Grenada",
      location: "Grenada",
      category: "Tours & Activities",
      description,
      source: "Viator",
      url: link,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}
