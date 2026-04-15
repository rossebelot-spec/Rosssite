/**
 * Validates the admin-provided hosted MP4 URL (R2 or any HTTPS origin).
 */
export function requireHostedVideoUrl(
  raw: string | null | undefined,
  label = "Hosted video URL"
): string {
  const t = (raw ?? "").trim();
  if (!t) {
    throw new Error(`${label} is required (HTTPS link to the MP4).`);
  }
  if (!/^https:\/\//i.test(t)) {
    throw new Error(`${label} must start with https://`);
  }
  return t;
}
