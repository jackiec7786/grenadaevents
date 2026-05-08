const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";

export function extractDateText(text: string): string | null {
  const patterns = [
    new RegExp(`\\b(?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?`, "i"),
    /\b\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i,
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return null;
}

export function extractTimeText(text: string): string | null {
  const match = text.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b(?:\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)?/i);
  return match?.[0] ?? null;
}
