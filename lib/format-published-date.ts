/** Short month, day, year (en-US) — e.g. Apr 13, 2026. Reading / article bylines. */
export function formatPublishedDate(publishedAt: Date | null): string {
  if (!publishedAt) return "";
  return new Date(publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Long month (en-CA) — e.g. April 13, 2026. Index listings (essays, reviews, news). */
export function formatPublishedDateLong(publishedAt: Date | null): string {
  if (!publishedAt) return "";
  return new Date(publishedAt).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Compact month + year (en-CA short month) — home “Recent essays” lines. */
export function formatPublishedMonthYear(publishedAt: Date | null): string {
  if (!publishedAt) return "";
  return new Date(publishedAt).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
  });
}
