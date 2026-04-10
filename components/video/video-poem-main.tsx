import { VideoPoemEssay } from "./video-poem-essay";

interface VideoPoemMainProps {
  collectionTitle: string;
  title: string;
  vimeoId: string;
  essayHtml: string;
}

export function VideoPoemMain({
  collectionTitle,
  title,
  vimeoId,
  essayHtml,
}: VideoPoemMainProps) {
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
        <p className="font-heading text-4xl md:text-5xl mb-8 text-balance">
          {collectionTitle}
        </p>
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?dnt=1&title=0&byline=0&portrait=0`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <h1 className="font-heading text-3xl mt-8">{title}</h1>
      </div>
      <VideoPoemEssay html={essayHtml} />
    </div>
  );
}
