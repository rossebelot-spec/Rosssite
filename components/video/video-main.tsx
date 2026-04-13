import { VideoEssay } from "./video-essay";

interface VideoMainProps {
  /** `videos.title` — shown as the primary h1. */
  videoTitle: string;
  /** `content.title` for the linked published essay (may be absent). */
  essayTitle?: string | null;
  vimeoId: string;
  /** When set, a native video element is used instead of the Vimeo iframe. */
  r2Url?: string | null;
  /** Still shown before play when using R2/native `<video>` (`videos.thumbnail_url`). */
  thumbnailUrl?: string | null;
  essayHtml: string;
}

export function VideoMain({
  videoTitle,
  essayTitle,
  vimeoId,
  r2Url,
  thumbnailUrl,
  essayHtml,
}: VideoMainProps) {
  const essayTitleTrimmed = (essayTitle ?? "").trim();
  const poster = thumbnailUrl?.trim() || undefined;

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
          {r2Url?.trim() ? (
            <video
              src={r2Url.trim()}
              controls
              preload="metadata"
              className="absolute inset-0 h-full w-full object-contain"
              poster={poster}
            />
          ) : (
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?dnt=1&title=0&byline=0&portrait=0`}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
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
