import * as cheerio from "cheerio";
import { EventItem } from "../types";
import { cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const SEARCH_BASE = "https://html.duckduckgo.com/html/";

// Queries tuned to the Caribbean island of Grenada specifically
const QUERIES = [
  "Grenada island events 2026",
  "Spicemas 2026 schedule",
  "Grenada carnival 2026",
  "Grenada festival 2026",
];

// Domains already covered by dedicated scrapers — skip duplicates
const SKIP_DOMAINS = [
  "puregrenada.com",
  "partygrenada.com",
  "go2fete.com",
  "spicemasgrenada.com",
  "fetelist.com",
  "caribbeanevents.com",
  "ilovecarnival.com",
  "nowgrenada.com",
];

function isSkippedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return SKIP_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

async function searchQuery(query: string, scrapedAt: string): Promise<EventItem[]> {
  const body = new URLSearchParams({ q: query, kl: "us-en" });

  const res = await fetch(SEARCH_BASE, {
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`DuckDuckGo search returned ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const events: EventItem[] = [];

  $(".result, .web-result").each((_, el) => {
    const block = $(el);

    const titleEl = block.find("a.result__a, h2.result__title a").first();
    const title = cleanText(titleEl.text());
    if (!title || title.length < 4) return;

    // DuckDuckGo wraps the real URL in a redirect — extract from href or data attributes
    const rawHref =
      titleEl.attr("href") ||
      block.find("a.result__a").attr("href") ||
      "";
    let url = rawHref;
    try {
      // DDG sometimes encodes the real URL as uddg= param
      const parsed = new URL(rawHref, SEARCH_BASE);
      url = parsed.searchParams.get("uddg") || rawHref;
    } catch {
      // keep rawHref
    }

    if (!url || url.startsWith("/") || isSkippedDomain(url)) return;

    const snippet = cleanText(block.find(".result__snippet").first().text());
    const combined = `${title} ${snippet}`;

    // Must mention Grenada (the island) to avoid false matches
    if (!combined.toLowerCase().includes("grenada")) return;

    const event: EventItem = {
      id: "",
      title,
      startDate: extractDateText(combined),
      time: extractTimeText(combined),
      venue: null,
      location: "Grenada",
      category: "Web Search",
      description: snippet || null,
      source: "Web Search",
      url,
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
    QUERIES.map((q) => searchQuery(q, scrapedAt))
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
