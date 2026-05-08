import { NextRequest, NextResponse } from "next/server";
import { scrapeAllEvents } from "@/lib/scrape";
import { saveEvents } from "@/lib/events-store";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SCRAPE_SECRET;
  if (!secret) return true;

  const cronHeader = req.headers.get("x-vercel-cron");
  if (cronHeader === "1") return true;

  const provided = req.nextUrl.searchParams.get("secret");
  return provided === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await scrapeAllEvents();
  await saveEvents(result);

  return NextResponse.json({
    ...result,
    saved: Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  });
}
