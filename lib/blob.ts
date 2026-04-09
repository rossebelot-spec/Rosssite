/**
 * Returns the URL to use when rendering a blob image.
 * Public blobs (access: "public") are served directly from Vercel's CDN.
 * Falls back to the /api/image proxy for any legacy private blob URLs.
 */
export function blobImageUrl(blobUrl: string): string {
  if (!blobUrl) return "";
  // Public blob URLs contain ".public.blob.vercel-storage.com" — serve directly
  if (blobUrl.includes(".public.blob.vercel-storage.com")) {
    return blobUrl;
  }
  // Legacy private blobs: proxy through server to attach auth token
  return `/api/image?url=${encodeURIComponent(blobUrl)}`;
}
