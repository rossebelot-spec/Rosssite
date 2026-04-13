import Link from "next/link";

interface HomeFeaturedVideoProps {
  slug: string;
  title: string;
  description: string;
  vimeoId: string;
  r2Url: string | null;
  thumbnailUrl?: string | null;
}

/**
 * Inline viewer for the home grid — same source rules as `VideoMain` (R2 prefers over Vimeo).
 */
export function HomeFeaturedVideo({
  slug,
  title,
  description,
  vimeoId,
  r2Url,
  thumbnailUrl,
}: HomeFeaturedVideoProps) {
  const r2 = r2Url?.trim() ?? "";
  const poster = thumbnailUrl?.trim() || undefined;

  return (
    <div className="flex flex-col gap-3">
      <p className="font-heading text-xl text-foreground">{title}</p>
      <div className="relative w-full aspect-video overflow-hidden rounded-md bg-black">
        {r2 ? (
          <video
            src={r2}
            controls
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain"
            poster={poster}
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
      {description.trim() ? (
        <p className="text-sm text-muted-foreground line-clamp-5">{description}</p>
      ) : null}
      <Link
        href={`/video/${slug}`}
        className="text-xs tracking-widest uppercase text-warm-accent hover:text-foreground transition-colors"
      >
        Credits and full page &rarr;
      </Link>
    </div>
  );
}
