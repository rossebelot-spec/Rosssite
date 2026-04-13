/**
 * Inline player only — mirrors `VideoMain` / previous `HomeFeaturedVideo` playback rules.
 * Used in the home hero name panel; copy sits in the three-column row below.
 */
export function HomeFeaturedVideoPlayer({
  title,
  vimeoId,
  r2Url,
  thumbnailUrl,
}: {
  title: string;
  vimeoId: string;
  r2Url: string | null;
  thumbnailUrl?: string | null;
}) {
  const r2 = r2Url?.trim() ?? "";
  const poster = thumbnailUrl?.trim() || undefined;

  return (
    <div className="home-hero-featured-player relative w-full max-w-full aspect-video overflow-hidden rounded-md bg-black">
      {r2 ? (
        <video
          src={r2}
          controls
          preload="metadata"
          className="absolute inset-0 h-full w-full object-contain"
          poster={poster}
          aria-label={`Play video: ${title}`}
        />
      ) : (
        <iframe
          title={title}
          src={`https://player.vimeo.com/video/${vimeoId}?dnt=1&title=0&byline=0&portrait=0`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
