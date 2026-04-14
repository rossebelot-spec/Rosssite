/**
 * Canonical origin for metadata, sitemap, robots, and JSON-LD.
 * Set `NEXT_PUBLIC_SITE_URL` in production (e.g. `https://www.example.com`, no trailing slash).
 * On Vercel, `VERCEL_URL` is used when the public URL is unset (preview deployments).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}
