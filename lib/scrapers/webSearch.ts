import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

// Google News RSS — free, no API key, works from cloud IPs
const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

const QUERIES = [
  '"Grenada W.I." events 2026',
  '"Grenada West Indies" events',
  "Spicemas 2026",
  '"Saint Georges" Grenada event',
];

const SKIP_DOMAINS = [
  "puregrenada.com",
  "partygrenada.com",
  "go2fete.com",
  "spicemasgrenada.com",
  "fetelist.com",
  "caribbeanevents.com",
  "ilovecarnival.com",
  "nowgrenada.com",
  "eventbrite.com",
  "bandsintown.com",
  "viator.com",
];

function isSkippedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return SKIP_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

async function fetchFeed(query: string, scrapedAt: string): Promise<EventItem[]> {
  const url = `${GOOGLE_NEWS_RSS}?${new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  })}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Google News RSS returned ${res.status}`);

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const events: EventItem[] = [];

  $("item").each((_, el) => {
    const item = $(el);
    const title = cleanText(item.find("title").first().text());
    if (!title || title.length < 4) return;

    // Google News wraps links in a redirect — the <link> text node holds the real URL
    const rawLink =
      item.find("link").text() ||
      item.find("guid").text();
    if (!rawLink || isSkippedDomain(rawLink)) return;

    const pubDate = cleanText(item.find("pubDate").text());
    const description = cleanText(
      cheerio.load(item.find("description").text()).text()
    );
    const combined = `${title} ${description}`.toLowerCase();

    if (!combined.includes("grenada")) return;
    if (combined.includes("mississippi") || combined.includes(", ms ")) return;

    const event: EventItem = {
      id: "",
      title,
      startDate: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : extractDateText(combined),
      time: extractTimeText(combined),
      venue: null,
      location: "Grenada",
      category: "News",
      description: description || null,
      source: "Google News",
      url: rawLink,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  });

  return events;
}

export async function scrapeWebSearch(): Promise<EventItem[]> {
  const scrapedAt = new Date().toISOString();
  const results = await Promise.allSettled(
    QUERIES.map((q) => fetchFeed(q, scrapedAt))
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
