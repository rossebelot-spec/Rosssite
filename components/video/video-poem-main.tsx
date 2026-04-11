import { VideoPoemEssay } from "./video-poem-essay";

interface VideoPoemMainProps {
  /** `video_poems.title` — shown above the player. */
  videoTitle: string;
  /** `content.title` for the linked published essay (may be absent from serialized props). */
  essayTitle?: string | null;
  vimeoId: string;
  essayHtml: string;
}

export function VideoPoemMain({
  videoTitle,
  essayTitle,
  vimeoId,
  essayHtml,
}: VideoPoemMainProps) {
  const essayTitleTrimmed = (essayTitle ?? "").trim();

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
        <h1 className="font-heading text-4xl md:text-5xl mb-8 text-balance">
          {videoTitle}
        </h1>
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?dnt=1&title=0&byline=0&portrait=0`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        {essayTitleTrimmed ? (
          <h2 className="font-heading text-3xl text-balance">{essayTitleTrimmed}</h2>
        ) : null}
        <VideoPoemEssay html={essayHtml} />
      </div>
    </div>
  );
}
