import { EventItem } from "../types";
import { cleanText, makeEventId } from "../utils";
import { extractDateText, extractTimeText } from "../date-parser";

const BRAVE_API = "https://api.search.brave.com/res/v1/web/search";

const QUERIES = [
  '"Grenada W.I." events 2026',
  '"Grenada West Indies" events 2026',
  "Spicemas 2026 schedule",
  '"St. George\'s Grenada" events 2026',
];

// Domains covered by dedicated scrapers — skip to avoid duplicates
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

type BraveResult = {
  title?: string;
  url?: string;
  description?: string;
  page_age?: string;
};

type BraveResponse = {
  web?: { results?: BraveResult[] };
};

async function searchQuery(query: string, apiKey: string, scrapedAt: string): Promise<EventItem[]> {
  const url = `${BRAVE_API}?${new URLSearchParams({ q: query, count: "20" })}`;

  const res = await fetch(url, {
    headers: {
      "X-Subscription-Token": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Brave Search returned ${res.status}`);

  const data = (await res.json()) as BraveResponse;
  const results = data.web?.results ?? [];
  const events: EventItem[] = [];

  for (const result of results) {
    const title = cleanText(result.title);
    if (!title || title.length < 4) continue;

    const eventUrl = result.url;
    if (!eventUrl || isSkippedDomain(eventUrl)) continue;

    const description = cleanText(result.description);
    const combined = `${title} ${description}`.toLowerCase();

    if (!combined.includes("grenada")) continue;
    if (combined.includes("mississippi") || combined.includes(", ms ")) continue;

    const event: EventItem = {
      id: "",
      title,
      startDate: result.page_age
        ? result.page_age.slice(0, 10)
        : extractDateText(combined),
      time: extractTimeText(combined),
      venue: null,
      location: "Grenada",
      category: "Web Search",
      description: description || null,
      source: "Web Search",
      url: eventUrl,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  }

  return events;
}

export async function scrapeWebSearch(): Promise<EventItem[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) throw new Error("BRAVE_API_KEY is not set");

  const scrapedAt = new Date().toISOString();

  const results = await Promise.allSettled(
    QUERIES.map((q) => searchQuery(q, apiKey, scrapedAt))
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
