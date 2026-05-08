import { scrapeCaribbeanEvents } from "./scrapers/caribbeanEvents";
import { scrapeEventbrite } from "./scrapers/eventbrite";
import { scrapeFeteList } from "./scrapers/feteList";
import { scrapeGo2Fete } from "./scrapers/go2fete";
import { scrapeIloveCarnival } from "./scrapers/iloveCarnival";
import { scrapeNowGrenada } from "./scrapers/nowGrenada";
import { scrapePartyGrenada } from "./scrapers/partyGrenada";
import { scrapePureGrenada } from "./scrapers/pureGrenada";
import { scrapeSpicemas } from "./scrapers/spicemas";
import { ScrapeResult } from "./types";
import { dedupeEvents } from "./utils";

export async function scrapeAllEvents(): Promise<ScrapeResult> {
  const scrapedAt = new Date().toISOString();

  const scrapers = [
    scrapePureGrenada,
    scrapePartyGrenada,
    scrapeGo2Fete,
    scrapeNowGrenada,
    scrapeEventbrite,
    scrapeSpicemas,
    scrapeFeteList,
    scrapeCaribbeanEvents,
    scrapeIloveCarnival,
  ];

  const results = await Promise.allSettled(scrapers.map((scraper) => scraper()));
  const events = dedupeEvents(
    results.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
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
