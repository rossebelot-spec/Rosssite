import { VideoEssay } from "./video-essay";
import { VideoPlayer } from "./video-player";

interface VideoMainProps {
  /** `videos.title` — shown as the primary h1. */
  videoTitle: string;
  /** `videos.slug` — used for analytics. */
  slug: string;
  /** Whether this video is on a standalone page or inside a collection. */
  context: "standalone" | "collection";
  /** `content.title` for the linked published essay (may be absent). */
  essayTitle?: string | null;
  /** Public HTTPS URL for the MP4 (e.g. Cloudflare R2). */
  r2Url: string | null;
  /** Poster when using native `<video>` (`videos.thumbnail_url`). */
  thumbnailUrl?: string | null;
  essayHtml: string;
}

export function VideoMain({
  videoTitle,
  slug,
  context,
  essayTitle,
  r2Url,
  thumbnailUrl,
  essayHtml,
}: VideoMainProps) {
  const essayTitleTrimmed = (essayTitle ?? "").trim();
  const poster = thumbnailUrl?.trim() || undefined;
  const src = r2Url?.trim() ?? "";

  return (
    <div className="flex flex-col gap-8">
      <div
        className="sticky z-10 pb-6"
        style={{
          top: "0px",
          background: "var(--color-folio-paper)",
          marginTop: "calc(-1 * var(--essay-folio-padding))",
          paddingTop: "calc(var(--site-header-height) + var(--essay-folio-padding))",
          marginLeft: "calc(-1 * var(--essay-folio-padding))",
          marginRight: "calc(-1 * var(--essay-folio-padding))",
          paddingLeft: "var(--essay-folio-padding)",
          paddingRight: "var(--essay-folio-padding)",
        }}
      >
        <h1 className="font-heading text-3xl md:text-4xl mb-8 text-balance">
          {videoTitle}
        </h1>
        <div className="relative w-full aspect-video bg-black">
          {src ? (
            <VideoPlayer
              src={src}
              poster={poster}
              title={videoTitle}
              slug={slug}
              context={context}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
              No hosted video URL is set for this page.
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-6">
        {essayTitleTrimmed ? (
          <h2 className="font-heading text-3xl text-balance">{essayTitleTrimmed}</h2>
        ) : null}
        <VideoEssay html={essayHtml} />
      </div>
    </div>
  );
}
