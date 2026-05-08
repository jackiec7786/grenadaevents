export type EventItem = {
  id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  time?: string | null;
  venue?: string | null;
  location?: string | null;
  category?: string | null;
  description?: string | null;
  source: string;
  url: string;
  scrapedAt: string;
};

export type ScrapeResult = {
  count: number;
  events: EventItem[];
  errors: string[];
  scrapedAt: string;
};
