/**
 * Inline player only — same rules as `VideoMain`: HTTPS MP4 URL (e.g. R2).
 * Used in the home hero name panel; copy sits in the three-column row below.
 */
export function HomeFeaturedVideoPlayer({
  title,
  r2Url,
  thumbnailUrl,
}: {
  title: string;
  r2Url: string | null;
  thumbnailUrl?: string | null;
}) {
  const r2 = r2Url?.trim() ?? "";
  const poster = thumbnailUrl?.trim() || undefined;

  if (!r2) {
    return (
      <div className="home-hero-featured-player relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-black px-3 text-center text-xs text-muted-foreground">
        Featured video has no hosted URL yet.
      </div>
    );
  }

  return (
    <div className="home-hero-featured-player relative aspect-video overflow-hidden rounded-md bg-black">
      <video
        src={r2}
        controls
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
        poster={poster}
        aria-label={`Play video: ${title}`}
      />
    </div>
  );
}
