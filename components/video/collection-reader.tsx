"use client";

import { CollectionSidebar, type SidebarItem } from "./collection-sidebar";
import { VideoPoemMain } from "./video-poem-main";
import { VideoPoemEssay } from "./video-poem-essay";

export interface CollectionPoemItem extends SidebarItem {
  vimeoId: string;
  /** From `content.title` when a published essay is linked to this poem. */
  essayTitle: string;
  essayHtml: string;
  description: string;
}

interface CollectionReaderProps {
  collection: {
    title: string;
    introHtml: string;
  };
  items: CollectionPoemItem[];
  activeSlug: string | null;
}

export function CollectionReader({
  collection,
  items,
  activeSlug,
}: CollectionReaderProps) {
  const activePoem = activeSlug
    ? items.find((i) => i.slug === activeSlug) ?? items[0] ?? null
    : null;

  return (
    <div className="min-h-dvh bg-[var(--color-reading-bg)]">
      <div className="grid min-h-0 grid-cols-1 md:grid-cols-[18rem_1fr]">
        {/* Sidebar: folio-white card on warm reading-bg (reversed from beige bar) */}
        <aside
          className="shrink-0 border-b border-[var(--color-folio-border)] bg-[var(--color-folio-paper)] px-4 pb-6 pt-0 text-[var(--color-charcoal)] md:sticky md:top-[var(--site-header-height)] md:m-3 md:max-h-[calc(100dvh_-_var(--site-header-height)_-_1.5rem)] md:self-start md:overflow-x-hidden md:overflow-y-auto md:rounded-lg md:border md:border-[var(--color-folio-border)] md:shadow-[var(--essay-folio-shadow)] overscroll-y-contain"
        >
          <div
            className="sticky top-[var(--site-header-height)] z-10 -mx-4 mb-4 border-b border-[var(--color-folio-border)]/70 bg-[var(--color-folio-paper)] px-4 pb-3 pt-6 md:top-0"
          >
            <p className="text-xs tracking-widest uppercase text-[var(--color-accent-muted)]">
              Select video
            </p>
          </div>
          <CollectionSidebar
            items={items}
            activeSlug={activePoem?.slug ?? null}
            collectionTitle={collection.title}
          />
        </aside>

        {/* Main content */}
        <main className="reading-theme essay-reading-shell min-h-0 md:min-h-dvh">
          <div className="journal-folio-paper essay-reading-paper">
            {activePoem ? (
              <VideoPoemMain
                videoTitle={activePoem.title}
                essayTitle={activePoem.essayTitle ?? ""}
                vimeoId={activePoem.vimeoId}
                essayHtml={activePoem.essayHtml}
              />
            ) : (
              <div className="space-y-6">
                <h1 className="font-heading text-3xl">{collection.title}</h1>
                {collection.introHtml ? (
                  <VideoPoemEssay html={collection.introHtml} />
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
