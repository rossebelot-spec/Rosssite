"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { updateCollection } from "@/lib/actions";

interface CollectionRow {
  id: number;
  title: string;
  slug: string;
  mediaType: string;
  displayOrder: number;
  published: boolean;
  itemCount: number;
}

export default function AdminCollectionsPage() {
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [saving, setSaving] = useState<number | null>(null); // id being saved

  useEffect(() => {
    fetch("/api/admin/collections-ordered")
      .then((r) => r.json())
      .then((data: CollectionRow[]) => {
        if (Array.isArray(data)) setRows(data);
      });
  }, []);

  async function move(index: number, direction: -1 | 1) {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= rows.length) return;

    // Swap the two rows in the array, then reassign orders by position
    const next = [...rows];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    const reordered = next.map((row, i) => ({ ...row, displayOrder: i }));
    setRows(reordered);

    setSaving(reordered[swapIndex].id);
    try {
      await Promise.all([
        updateCollection(reordered[index].id, { displayOrder: index }),
        updateCollection(reordered[swapIndex].id, { displayOrder: swapIndex }),
      ]);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Collections</h1>
        <Link
          href="/admin/collections/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New Collection
        </Link>
      </div>
      <p className="text-muted-foreground text-sm mb-6 max-w-prose">
        Use the ↑ ↓ arrows to set the order collections appear on the{" "}
        <a href="/multimedia" className="text-warm-accent hover:underline" target="_blank">
          Multimedia
        </a>{" "}
        page.
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No collections yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((coll, i) => (
            <li
              key={coll.id}
              className="py-4 flex items-center gap-4"
            >
              {/* Up / Down buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || saving !== null}
                  aria-label="Move up"
                  className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors text-xs leading-none"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1 || saving !== null}
                  aria-label="Move down"
                  className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors text-xs leading-none"
                >
                  ↓
                </button>
              </div>

              {/* Position number */}
              <span className="text-xs text-muted-foreground w-5 text-right shrink-0 tabular-nums">
                {i + 1}
              </span>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/collections/${coll.id}`}
                  className="font-heading text-lg hover:text-warm-accent transition-colors"
                >
                  {coll.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {coll.slug} · {coll.itemCount} items ·{" "}
                  {coll.mediaType === "photo" ? "Photo" : "Video"} collection
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {saving === coll.id && (
                  <span className="text-xs text-muted-foreground">Saving…</span>
                )}
                <Badge variant={coll.published ? "default" : "secondary"}>
                  {coll.published ? "Published" : "Draft"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
