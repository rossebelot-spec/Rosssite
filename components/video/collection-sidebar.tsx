import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  slug: string;
  title: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  durationSeconds: number | null;
}

interface CollectionSidebarProps {
  items: SidebarItem[];
  activeSlug: string | null;
  collectionTitle: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CollectionSidebar({
  items,
  activeSlug,
  collectionTitle,
}: CollectionSidebarProps) {
  return (
    <nav aria-label={`${collectionTitle} videos`}>
      <ul className="space-y-3">
        {items.map((item, index) => {
          const slugKey = item.slug?.trim();
          const row = (
            <>
              {item.thumbnailUrl && (
                <div className="relative w-full aspect-video shrink-0 overflow-hidden rounded bg-surface">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.thumbnailAlt || item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 767px) 100vw, 272px"
                  />
                </div>
              )}
              <div className="min-w-0 w-full">
                <p
                  className={cn(
                    "text-sm font-medium leading-snug text-balance",
                    activeSlug === item.slug && "text-warm-accent"
                  )}
                >
                  {item.title}
                </p>
                {item.durationSeconds != null && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDuration(item.durationSeconds)}
                  </p>
                )}
              </div>
            </>
          );

          const baseClass = cn(
            "flex flex-col gap-2 rounded p-2 transition-colors",
            activeSlug === item.slug ? "bg-warm-accent/10" : "hover:bg-surface"
          );

          return (
            <li key={slugKey || `item-${index}`}>
              {slugKey ? (
                <Link
                  href={`?poem=${encodeURIComponent(slugKey)}`}
                  scroll={false}
                  className={baseClass}
                >
                  {row}
                </Link>
              ) : (
                <div
                  className={cn(baseClass, "cursor-not-allowed opacity-70")}
                  title="Missing slug — fix in admin"
                >
                  {row}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
