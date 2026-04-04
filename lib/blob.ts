/**
 * Converts a private Vercel Blob URL to the site's image proxy URL.
 * Use this everywhere a blob image is rendered — never expose the raw
 * blob URL to the browser since the store is private.
 */
export function blobImageUrl(blobUrl: string): string {
  if (!blobUrl) return "";
  return `/api/image?url=${encodeURIComponent(blobUrl)}`;
}
