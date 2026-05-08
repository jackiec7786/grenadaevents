# Grenada Events App

A GitHub-ready Next.js app for collecting and displaying Grenada event information from selected public event sources.

The app is designed for Vercel:

- `GET /api/events` returns stored events, or performs a live scrape if no storage is configured.
- `GET /api/scrape` scrapes selected sources and optionally saves the results to Vercel Blob.
- `vercel.json` schedules a daily scrape through Vercel Cron.
- The homepage displays the event cards.

## Current event sources

- Pure Grenada events
- Party Grenada events
- Go2Fete

This does **not** crawl the entire internet. It scrapes selected sources that you explicitly add to the project.

## Tech stack

- Next.js App Router
- TypeScript
- Cheerio for HTML parsing
- Vercel Functions
- Vercel Cron
- Optional Vercel Blob storage

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Test the API routes:

```text
http://localhost:3000/api/events
http://localhost:3000/api/scrape
```

## Deploy to GitHub

Create a new GitHub repository, then run:

```bash
git init
git add .
git commit -m "Initial Grenada events app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/grenada-events-app.git
git push -u origin main
```

Then import the repo into Vercel.

## Deploy to Vercel

1. Go to Vercel.
2. Import the GitHub repository.
3. Deploy.
4. Optional: add Vercel Blob storage.
5. Optional: add environment variables listed below.

## Environment variables

Create these in Vercel Project Settings > Environment Variables.

```bash
# Optional. Protects /api/scrape from public manual triggering.
SCRAPE_SECRET=replace-with-a-long-random-string

# Optional. Added automatically by Vercel Blob integration.
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

If you set `SCRAPE_SECRET`, manually trigger scraping with:

```text
/api/scrape?secret=YOUR_SECRET
```

Vercel Cron requests are still allowed through the `x-vercel-cron` header.

## Cron schedule

`vercel.json` runs scraping daily at 09:00 UTC:

```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## How storage works

Without Vercel Blob:

- `/api/events` performs a live scrape.
- This is okay for testing, but not ideal for production.

With Vercel Blob:

- `/api/scrape` saves `events.json`.
- `/api/events` reads the saved file.
- The homepage loads faster and avoids scraping sources on every visitor request.

## Adding a new source

1. Create a new file in `lib/scrapers`, for example:

```text
lib/scrapers/newSource.ts
```

2. Export a scraper function that returns `EventItem[]`.
3. Add it to the `scrapers` array in `lib/scrape.ts`.

## Notes

Scraper selectors may need occasional maintenance when source websites change their HTML. Keep scraping polite: avoid high-frequency requests, respect source site terms, and prefer official APIs where available.
