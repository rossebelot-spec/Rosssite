"use client";

import { useEffect, useState } from "react";
import { CollectionSidebar, type SidebarItem } from "./collection-sidebar";
import { VideoMain } from "./video-main";
import { VideoEssay } from "./video-essay";

export interface CollectionVideoItem extends SidebarItem {
  r2Url?: string | null;
  essayTitle: string;
  essayHtml: string;
  description: string;
}

interface CollectionReaderProps {
  collection: {
    title: string;
    introHtml: string;
  };
  items: CollectionVideoItem[];
}

export function CollectionReader({
  collection,
  items,
}: CollectionReaderProps) {
  const firstSlug = items.find((i) => i.slug?.trim())?.slug ?? null;
  // Server (and the first client render) default to the first video so the static
  // HTML carries real content; the URL's ?poem= is honored after mount.
  const [activeSlug, setActiveSlug] = useState<string | null>(firstSlug);

  // Honor ?poem= deep links on mount and on browser back/forward navigation.
  useEffect(() => {
    const syncFromUrl = () => {
      const poem = new URLSearchParams(window.location.search).get("poem")?.trim();
      setActiveSlug(poem && items.some((i) => i.slug === poem) ? poem : firstSlug);
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [items, firstSlug]);

  const activeVideo =
    (activeSlug ? items.find((i) => i.slug === activeSlug) : null) ??
    items[0] ??
    null;

  const handleSelect = (slug: string) => {
    setActiveSlug(slug);
    // Reflect the selection in a shareable URL without a server round-trip.
    window.history.pushState(null, "", `?poem=${encodeURIComponent(slug)}`);
    window.umami?.track("video:collection-switch", {
      collection: collection.title,
      to: slug,
    });
  };

  return (
    <div className="min-h-dvh bg-[var(--color-reading-bg)]">
      <div className="grid min-h-0 grid-cols-1 md:grid-cols-[18rem_1fr]">
        {/* Sidebar */}
        <aside
          className="shrink-0 border-b border-[var(--color-folio-border)] bg-[var(--color-folio-paper)] px-4 pb-6 pt-0 text-[var(--color-charcoal)] md:sticky md:top-[var(--site-header-height)] md:m-3 md:max-h-[calc(100dvh_-_var(--site-header-height)_-_1.5rem)] md:self-start md:overflow-x-hidden md:overflow-y-auto md:rounded-lg md:border md:border-[var(--color-folio-border)] md:shadow-[var(--essay-folio-shadow)] overscroll-y-contain"
        >
          <div className="sticky top-[var(--site-header-height)] z-10 -mx-4 mb-4 border-b border-[var(--color-folio-border)]/70 bg-[var(--color-folio-paper)] px-4 pb-3 pt-6 md:top-0">
            <p className="text-xs tracking-widest uppercase text-[var(--color-accent-muted)]">
              Select video
            </p>
          </div>
          <CollectionSidebar
            items={items}
            activeSlug={activeVideo?.slug ?? null}
            collectionTitle={collection.title}
            onSelect={handleSelect}
          />
        </aside>

        {/* Main content */}
        <main className="reading-theme essay-reading-shell min-h-0 md:min-h-dvh">
          <div className="journal-folio-paper essay-reading-paper">
            {activeVideo ? (
              <VideoMain
                videoTitle={activeVideo.title}
                slug={activeVideo.slug}
                context="collection"
                essayTitle={activeVideo.essayTitle}
                r2Url={activeVideo.r2Url ?? null}
                thumbnailUrl={activeVideo.thumbnailUrl}
                essayHtml={activeVideo.essayHtml}
              />
            ) : (
              <div className="space-y-6">
                <h1 className="font-heading text-3xl">{collection.title}</h1>
                {collection.introHtml ? (
                  <VideoEssay html={collection.introHtml} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Select a video from the sidebar to begin.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
