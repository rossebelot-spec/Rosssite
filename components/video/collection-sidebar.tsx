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
    <nav aria-label={`${collectionTitle} poems`}>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`?poem=${item.slug}`}
              scroll={false}
              className={cn(
                "flex gap-3 rounded p-2 transition-colors",
                activeSlug === item.slug
                  ? "bg-warm-accent/10"
                  : "hover:bg-surface"
              )}
            >
              {item.thumbnailUrl && (
                <div className="relative w-20 shrink-0 aspect-video rounded overflow-hidden bg-surface">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.thumbnailAlt || item.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    activeSlug === item.slug && "text-warm-accent"
                  )}
                >
                  {item.title}
                </p>
                {item.durationSeconds != null && (
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(item.durationSeconds)}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
