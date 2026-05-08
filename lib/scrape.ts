import { scrapeCaribbeanEvents } from "./scrapers/caribbeanEvents";
import { scrapeFeteList } from "./scrapers/feteList";
import { scrapeIloveCarnival } from "./scrapers/iloveCarnival";
import { scrapePureGrenada } from "./scrapers/pureGrenada";
import { scrapeWebSearch } from "./scrapers/webSearch";
import { ScrapeResult } from "./types";
import { dedupeEvents, isUpcoming } from "./utils";

export async function scrapeAllEvents(): Promise<ScrapeResult> {
  const scrapedAt = new Date().toISOString();

  const scrapers = [
    scrapePureGrenada,
    scrapeFeteList,
    scrapeCaribbeanEvents,
    scrapeIloveCarnival,
    scrapeWebSearch,
  ];

  const results = await Promise.allSettled(scrapers.map((scraper) => scraper()));
  const events = dedupeEvents(
    results
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .filter(isUpcoming)
  );

  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) =>
      String(result.reason instanceof Error ? result.reason.message : result.reason)
    );

  return {
    count: events.length,
    events,
    errors,
    scrapedAt,
  };
}
