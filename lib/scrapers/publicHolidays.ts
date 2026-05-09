import { EventItem } from "../types";
import { cleanText, makeEventId } from "../utils";

// Office Holidays ICS feed for Grenada (GD)
const ICS_URL = "https://www.officeholidays.com/ics/ics_country_iso.php?tbl_country=GD";

function parseDate(raw: string): string | null {
  // DTSTART;VALUE=DATE:20260101  →  2026-01-01
  const match = raw.match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function unescapeIcs(value: string): string {
  return value.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\\\/g, "\\").trim();
}

function extractField(lines: string[], fieldPrefix: string): string {
  for (const line of lines) {
    if (line.startsWith(fieldPrefix)) {
      // Handle folded lines (continuation lines start with a space/tab)
      return line.slice(fieldPrefix.length);
    }
  }
  return "";
}

export async function scrapePublicHolidays(): Promise<EventItem[]> {
  const res = await fetch(ICS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/calendar, text/plain, */*",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Office Holidays ICS returned ${res.status}`);

  const text = await res.text();
  const scrapedAt = new Date().toISOString();
  const events: EventItem[] = [];

  // Split into VEVENT blocks
  const blocks = text.split("BEGIN:VEVENT").slice(1);

  for (const block of blocks) {
    const end = block.indexOf("END:VEVENT");
    const content = end >= 0 ? block.slice(0, end) : block;

    // Unfold lines (RFC 5545: continuation lines start with CRLF + whitespace)
    const unfolded = content.replace(/\r?\n[ \t]/g, "");
    const lines = unfolded.split(/\r?\n/);

    const rawSummary = extractField(lines, "SUMMARY");
    // Strip language tag and "Grenada: " prefix
    const summaryClean = rawSummary.replace(/^;LANGUAGE=[^:]+:/, "").replace(/^Grenada:\s*/i, "");
    const title = cleanText(unescapeIcs(summaryClean));
    if (!title) continue;

    const rawStart = extractField(lines, "DTSTART");
    const startDate = parseDate(rawStart);
    if (!startDate) continue;

    const rawEnd = extractField(lines, "DTEND");
    const endDate = parseDate(rawEnd);

    const url =
      extractField(lines, "URL:").trim() ||
      `https://www.officeholidays.com/holidays/grenada`;

    const rawDesc = extractField(lines, "DESCRIPTION:");
    const description = cleanText(unescapeIcs(rawDesc))
      .replace(/Information provided by www\.officeholidays\.com\.?/gi, "")
      .trim() || null;

    const event: EventItem = {
      id: "",
      title,
      startDate,
      endDate: endDate ?? null,
      time: null,
      venue: null,
      location: "Grenada",
      category: "Public Holiday",
      description,
      source: "Office Holidays",
      url,
      scrapedAt,
    };
    event.id = makeEventId(event);
    events.push(event);
  }

  return events;
}
