import { VideoPoemEssay } from "./video-poem-essay";

interface VideoPoemMainProps {
  title: string;
  vimeoId: string;
  essayHtml: string;
}

export function VideoPoemMain({
  title,
  vimeoId,
  essayHtml,
}: VideoPoemMainProps) {
  return (
    <div className="space-y-8">
      <div className="relative w-full aspect-video bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?dnt=1&title=0&byline=0&portrait=0`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
      <h1 className="font-heading text-3xl">{title}</h1>
      <VideoPoemEssay html={essayHtml} />
    </div>
  );
}
