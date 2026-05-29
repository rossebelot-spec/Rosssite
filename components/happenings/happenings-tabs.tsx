"use client";

import { cn } from "@/lib/utils";

export type HappeningsTab = "news" | "events" | "readings";

const TABS: { id: HappeningsTab; label: string }[] = [
  { id: "news", label: "News" },
  { id: "events", label: "Events" },
  { id: "readings", label: "Video Readings" },
];

export function HappeningsTabs({
  active,
  onSelect,
}: {
  active: HappeningsTab;
  onSelect: (tab: HappeningsTab) => void;
}) {
  return (
    <div
      className="flex gap-6 mb-10 border-b border-border"
      role="tablist"
      aria-label="Happenings streams"
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onSelect(t.id)}
          className={cn(
            "text-xs tracking-widest uppercase pb-3 -mb-px border-b-2 transition-colors",
            active === t.id
              ? "border-warm-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
