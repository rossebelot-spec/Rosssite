import Link from "next/link";

interface HomeFeaturedVideoCopyProps {
  slug: string;
  title: string;
  description: string;
}

/**
 * Title, description, and credits link for the home “Featured video” column.
 * The player lives in `Hero` (`HomeFeaturedVideoPlayer`).
 */
export function HomeFeaturedVideoCopy({
  slug,
  title,
  description,
}: HomeFeaturedVideoCopyProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-heading text-xl text-foreground">{title}</p>
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
