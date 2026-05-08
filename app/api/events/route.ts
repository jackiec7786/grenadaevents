import { NextResponse } from "next/server";
import { loadEvents } from "@/lib/events-store";
import { scrapeAllEvents } from "@/lib/scrape";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const stored = await loadEvents();
  if (stored) return NextResponse.json(stored);

  const live = await scrapeAllEvents();
  return NextResponse.json({ ...live, storage: "live" });
}
