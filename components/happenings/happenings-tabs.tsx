import Link from "next/link";
import { cn } from "@/lib/utils";

export type HappeningsTab = "news" | "events" | "readings";

export function HappeningsTabs({ active }: { active: HappeningsTab }) {
  return (
    <div
      className="flex gap-6 mb-10 border-b border-border"
      role="tablist"
      aria-label="Happenings streams"
    >
      <Link
        href="/happenings?tab=news"
        role="tab"
        aria-selected={active === "news"}
        className={cn(
          "text-xs tracking-widest uppercase pb-3 -mb-px border-b-2 transition-colors",
          active === "news"
            ? "border-warm-accent text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        News
      </Link>
      <Link
        href="/happenings?tab=events"
        role="tab"
        aria-selected={active === "events"}
        className={cn(
          "text-xs tracking-widest uppercase pb-3 -mb-px border-b-2 transition-colors",
          active === "events"
            ? "border-warm-accent text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        Events
      </Link>
      <Link
        href="/happenings?tab=readings"
        role="tab"
        aria-selected={active === "readings"}
        className={cn(
          "text-xs tracking-widest uppercase pb-3 -mb-px border-b-2 transition-colors",
          active === "readings"
            ? "border-warm-accent text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        Readings
      </Link>
    </div>
  );
}
