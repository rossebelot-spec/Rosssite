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
    <div className="grid grid-cols-1 md:grid-cols-[18rem_1fr]">
      {/* Sidebar */}
      <aside className="dark bg-background text-foreground border-b border-border md:border-b-0 md:border-r md:sticky md:top-0 md:h-dvh md:overflow-y-auto px-4 py-6">
        <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
          {collection.title}
        </p>
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
                  Select a poem from the sidebar to begin.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
