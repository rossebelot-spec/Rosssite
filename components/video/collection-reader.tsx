"use client";

import { useEffect, useRef } from "react";
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
  activeSlug: string | null;
}

export function CollectionReader({
  collection,
  items,
  activeSlug,
}: CollectionReaderProps) {
  const activeVideo = activeSlug
    ? items.find((i) => i.slug === activeSlug) ?? items[0] ?? null
    : null;

  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!activeSlug) return;
    window.umami?.track("video:collection-switch", {
      collection: collection.title,
      to: activeSlug,
    });
  }, [activeSlug, collection.title]);

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
