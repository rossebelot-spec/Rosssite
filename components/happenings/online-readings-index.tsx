import { getDb } from "@/db";
import { onlineReadings, type OnlineReading } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/** Derive a YouTube thumbnail URL from a video ID. */
function youtubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/** Extract YouTube video ID from a standard YouTube URL. */
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch {
    // ignore
  }
  return null;
}

/** Resolve thumbnail URL: use stored value if present, else auto-derive for YouTube. */
function resolveThumbnail(reading: OnlineReading): string | null {
  if (reading.thumbnailUrl) return reading.thumbnailUrl;
  if (reading.platform === "youtube" && reading.externalUrl) {
    const id = extractYouTubeId(reading.externalUrl);
    if (id) return youtubeThumbnail(id);
  }
  return null;
}

/** Platform label for display. */
function platformLabel(platform: string) {
  if (platform === "youtube") return "YouTube";
  if (platform === "tiktok") return "TikTok";
  if (platform === "r2") return "Video";
  return platform;
}

function ReadingCard({ reading }: { reading: OnlineReading }) {
  const thumbnail = resolveThumbnail(reading);
  const href = reading.externalUrl ?? reading.r2Url ?? undefined;

  const TitleEl = href ? (
    <a
      href={href}
      target={reading.platform !== "r2" ? "_blank" : undefined}
      rel={reading.platform !== "r2" ? "noopener noreferrer" : undefined}
      className="font-heading text-xl mt-2 block hover:text-warm-accent transition-colors"
    >
      {reading.title}
    </a>
  ) : (
    <p className="font-heading text-xl mt-2">{reading.title}</p>
  );

  return (
    <li className="py-6 flex gap-5">
      {thumbnail && href ? (
        <a
          href={href}
          target={reading.platform !== "r2" ? "_blank" : undefined}
          rel={reading.platform !== "r2" ? "noopener noreferrer" : undefined}
          className="shrink-0 w-32 h-[72px] overflow-hidden rounded-sm bg-muted"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </a>
      ) : thumbnail ? (
        <div className="shrink-0 w-32 h-[72px] overflow-hidden rounded-sm bg-muted">
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <time className="text-xs tracking-widest uppercase text-muted-foreground shrink-0">
            {new Date(reading.date).toLocaleDateString("en-CA", {
              year: "numeric",
              month: "long",
            })}
          </time>
          <span className="text-xs tracking-widest uppercase text-warm-accent">
            {platformLabel(reading.platform)}
          </span>
        </div>
        {TitleEl}
        {reading.description ? (
          <p className="text-muted-foreground text-sm mt-1 leading-relaxed max-w-prose">
            {reading.description}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/** Online readings list for Happenings → Readings tab. */
export async function OnlineReadingsIndex() {
  const db = getDb();
  const rows = await db
    .select()
    .from(onlineReadings)
    .where(eq(onlineReadings.published, true))
    .orderBy(desc(onlineReadings.date));

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No readings posted yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((reading) => (
        <ReadingCard key={reading.id} reading={reading} />
      ))}
    </ul>
  );
}
