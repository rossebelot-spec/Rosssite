import { blobImageUrl } from "@/lib/blob";

/**
 * Public `/mastheads/*.svg` assets when the DB has no masthead_url (e.g. legacy rows).
 */
const DEFAULT_OP_ED_MASTHEAD_BY_SLUG: Record<string, string> = {
  "national-observer": "/mastheads/national-observer.svg",
  ipolitics: "/mastheads/ipolitics.svg",
};

export function resolveOpEdCollectionMastheadUrl(
  slug: string,
  mastheadUrl: string | null | undefined
): string | null {
  const trimmed = mastheadUrl?.trim();
  if (trimmed) return trimmed;
  return DEFAULT_OP_ED_MASTHEAD_BY_SLUG[slug] ?? null;
}

/**
 * Src for masthead <img>: same-origin paths stay as-is; Vercel Blob may use /api/image proxy.
 */
export function opEdMastheadImgSrc(url: string): string {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  if (url.includes(".blob.vercel-storage.com")) return blobImageUrl(url);
  return url;
}
