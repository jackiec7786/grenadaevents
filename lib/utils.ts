import crypto from "node:crypto";
import { EventItem } from "./types";

export function cleanText(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function absoluteUrl(url: string | undefined, baseUrl: string): string {
  if (!url) return baseUrl;
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

export function makeEventId(event: Pick<EventItem, "title" | "source" | "url">): string {
  return crypto
    .createHash("sha1")
    .update(`${event.title.toLowerCase()}|${event.source.toLowerCase()}|${event.url}`)
    .digest("hex");
}

export function isUpcoming(event: EventItem): boolean {
  if (!event.startDate) return true;
  const yearMatch = event.startDate.match(/\b(20\d{2})\b/);
  if (yearMatch) return parseInt(yearMatch[1]) >= 2026;
  return true; // no explicit year — assume upcoming
}

const JUNK_TITLE_PATTERNS = [
  /^chat\b/i,
  /\bchat with\b/i,
  /\bai assistant\b/i,
  /^sign (up|in)\b/i,
  /^log in\b/i,
  /^subscribe\b/i,
  /^newsletter\b/i,
  /^cookie(s| policy| notice)?\b/i,
  /^privacy policy\b/i,
  /^terms (of (service|use))?\b/i,
  /^(download|get) (the )?(app|our app)\b/i,
  /^back to top\b/i,
  /^skip to\b/i,
  /^menu\b/i,
  /^search\b/i,
  /^home\b/i,
  /^about us?\b/i,
  /^contact us?\b/i,
  /^all events?\b/i,
];

// Rejects CSS-fallback junk: chatbots, nav links, UI widgets, footers
export function isValidContent(event: EventItem): boolean {
  if (event.title.length < 6) return false;
  if (JUNK_TITLE_PATTERNS.some((re) => re.test(event.title))) return false;
  const hasDate = !!event.startDate;
  const hasDescription = (event.description?.length ?? 0) > 25;
  const hasVenue = !!event.venue;
  return hasDate || hasDescription || hasVenue;
}

function eventScore(e: EventItem): number {
  return (e.startDate ? 2 : 0) + (e.time ? 1 : 0) + (e.venue ? 1 : 0);
}

export function dedupeEvents(events: EventItem[]): EventItem[] {
  // First pass: dedupe by exact title+url
  const byTitleUrl = new Map<string, EventItem>();
  for (const event of events) {
    const key = `${event.title.toLowerCase()}|${event.url}`;
    if (!byTitleUrl.has(key)) byTitleUrl.set(key, event);
  }

  // Second pass: dedupe by title alone — keep the richest record
  const byTitle = new Map<string, EventItem>();
  for (const event of byTitleUrl.values()) {
    const key = event.title.toLowerCase();
    const existing = byTitle.get(key);
    if (!existing || eventScore(event) > eventScore(existing)) {
      byTitle.set(key, event);
    }
  }

  return Array.from(byTitle.values()).sort((a, b) => {
    const left = a.startDate ?? "9999-12-31";
    const right = b.startDate ?? "9999-12-31";
    return left.localeCompare(right) || a.title.localeCompare(b.title);
  });
}
