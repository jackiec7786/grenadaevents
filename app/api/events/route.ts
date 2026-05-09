import { NextRequest, NextResponse } from "next/server";
import { loadEvents } from "@/lib/events-store";
import { EventItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category")?.toLowerCase();
  const source   = searchParams.get("source")?.toLowerCase();
  const q        = searchParams.get("q")?.toLowerCase();
  const limit    = parseInt(searchParams.get("limit") ?? "0", 10);

  const stored = await loadEvents().catch(() => null);

  const allEvents: EventItem[] = stored?.events ?? [];

  let events = allEvents;

  if (category) {
    events = events.filter((e) => e.category?.toLowerCase() === category);
  }
  if (source) {
    events = events.filter((e) => e.source.toLowerCase() === source);
  }
  if (q) {
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
    );
  }
  if (limit > 0) {
    events = events.slice(0, limit);
  }

  return NextResponse.json(
    {
      count: events.length,
      events,
      scrapedAt: stored?.scrapedAt ?? null,
    },
    { headers: CORS }
  );
}
