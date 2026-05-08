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
