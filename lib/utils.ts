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

export function dedupeEvents(events: EventItem[]): EventItem[] {
  const seen = new Set<string>();
  const unique: EventItem[] = [];

  for (const event of events) {
    const key = `${event.title.toLowerCase()}|${event.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(event);
  }

  return unique.sort((a, b) => {
    const left = a.startDate ?? "9999-12-31";
    const right = b.startDate ?? "9999-12-31";
    return left.localeCompare(right) || a.title.localeCompare(b.title);
  });
}
