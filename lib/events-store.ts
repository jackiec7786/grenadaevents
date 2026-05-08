import { put, list } from "@vercel/blob";
import { ScrapeResult } from "./types";

const BLOB_PATH = "events.json";

type StoredEvents = ScrapeResult & { storage: "blob" | "live" };

export async function saveEvents(result: ScrapeResult): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;

  await put(BLOB_PATH, JSON.stringify(result, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
    addRandomSuffix: false,
  });
}

export async function loadEvents(): Promise<StoredEvents | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  const blobs = await list({ prefix: BLOB_PATH, limit: 1 });
  const blob = blobs.blobs.find((item) => item.pathname === BLOB_PATH);
  if (!blob) return null;

  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as ScrapeResult;
  return { ...data, storage: "blob" };
}
