/** Matches reference piece pages: short month, day, year (en-US). */
export function formatPublishedDate(publishedAt: Date | null): string {
  if (!publishedAt) return "";
  return new Date(publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
