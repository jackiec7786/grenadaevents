import { NextResponse } from "next/server";
import { loadEvents } from "@/lib/events-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const stored = await loadEvents();
  if (stored) return NextResponse.json(stored);

  // No blob storage configured — return empty rather than doing a live scrape
  // on every page load (too slow for serverless). Use /api/scrape to populate data.
  return NextResponse.json({
    count: 0,
    events: [],
    errors: [],
    scrapedAt: new Date().toISOString(),
    storage: "none",
  });
}
