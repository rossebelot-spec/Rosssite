"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronUp, ChevronDown, Plus, X } from "lucide-react";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  addVideoPoemToCollection,
  removeVideoPoemFromCollection,
  reorderCollectionItems,
} from "@/lib/actions";

interface CollectionData {
  id?: number;
  title: string;
  slug: string;
  introHtml: string;
  description: string;
  coverImageUrl: string;
  published: boolean;
  publishedAt: string;
  displayOrder: string;
}

interface CollectionItem {
  id: number;
  position: number;
  videoPoemId: number;
  title: string;
  slug: string;
  vimeoId: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  durationSeconds: number | null;
}

interface LibraryPoem {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

const empty: CollectionData = {
  title: "",
  slug: "",
  introHtml: "",
  description: "",
  coverImageUrl: "",
  published: false,
  publishedAt: "",
  displayOrder: "0",
};

export default function AdminCollectionEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<CollectionData>(empty);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [allPoems, setAllPoems] = useState<LibraryPoem[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchCollection = useCallback(async () => {
    const res = await fetch(`/api/admin/collections/${id}`);
    const coll = await res.json();
    setData({
      id: coll.id,
      title: coll.title,
      slug: coll.slug,
      introHtml: coll.introHtml,
      description: coll.description,
      coverImageUrl: coll.coverImageUrl ?? "",
      published: coll.published,
      publishedAt: coll.publishedAt
        ? new Date(coll.publishedAt).toISOString().split("T")[0]
        : "",
      displayOrder: String(coll.displayOrder),
    });
    setItems(coll.items);
  }, [id]);

  useEffect(() => {
    if (!isNew) fetchCollection();
  }, [isNew, fetchCollection]);

  useEffect(() => {
    fetch("/api/admin/video-poems")
      .then((r) => r.json())
      .then(setAllPoems);
  }, []);

  function set(field: keyof CollectionData, value: string | boolean) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function slugify(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      title: data.title,
      slug: data.slug,
      introHtml: data.introHtml,
      description: data.description,
      coverImageUrl: data.coverImageUrl || null,
      published: data.published,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      displayOrder: parseInt(data.displayOrder, 10) || 0,
    };

    if (isNew) {
      await createCollection({ ...payload, published: payload.published });
    } else {
      await updateCollection(data.id!, { ...payload, updatedAt: new Date() });
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this collection?")) return;
    await deleteCollection(data.id);
  }

  async function handleAddPoem(poemId: number) {
    if (!data.id) return;
    await addVideoPoemToCollection({
      collectionId: data.id,
      videoPoemId: poemId,
    });
    await fetchCollection();
  }

  async function handleRemovePoem(poemId: number) {
    if (!data.id) return;
    await removeVideoPoemFromCollection({
      collectionId: data.id,
      videoPoemId: poemId,
    });
    await fetchCollection();
  }

  async function handleMove(index: number, direction: "up" | "down") {
    if (!data.id) return;
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];
    setItems(newItems);
    await reorderCollectionItems({
      collectionId: data.id,
      orderedVideoPoemIds: newItems.map((item) => item.videoPoemId),
    });
  }

  const itemPoemIds = new Set(items.map((i) => i.videoPoemId));
  const availablePoems = allPoems.filter((p) => !itemPoemIds.has(p.id));

  return (
    <div className="space-y-6 max-w-screen-lg">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">
          {isNew ? "New Collection" : "Edit Collection"}
        </h1>
        <div className="flex gap-3">
          {!isNew && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* ── Metadata ──────────────────────────────────────────────── */}
      <div className="space-y-4 max-w-screen-md">
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Title
          </label>
          <Input
            value={data.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (isNew) set("slug", slugify(e.target.value));
            }}
            placeholder="Collection title"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Slug
          </label>
          <Input
            value={data.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="url-friendly-slug"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Description
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description for listing + OG meta"
            rows={3}
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">
            Cover Image (optional)
          </label>
          <ImageUploader
            existingUrl={data.coverImageUrl || undefined}
            onUpload={(url) => set("coverImageUrl", url)}
          />
        </div>

        <div className="flex gap-6 items-center">
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              Display Order
            </label>
            <Input
              type="number"
              value={data.displayOrder}
              onChange={(e) => set("displayOrder", e.target.value)}
              className="w-24"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              Publish Date
            </label>
            <Input
              type="date"
              value={data.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
              className="w-44"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input
              type="checkbox"
              checked={data.published}
              onChange={(e) => set("published", e.target.checked)}
              className="accent-warm-accent"
            />
            <span className="text-xs tracking-widest uppercase text-muted-foreground">
              Published
            </span>
          </label>
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">
            Intro
          </label>
          <TiptapEditor
            key={`collection-intro-${id}`}
            readingTheme
            content={data.introHtml}
            onChange={(html) => set("introHtml", html)}
          />
        </div>
      </div>

      {/* ── Item Picker / Reorder ─────────────────────────────────── */}
      {!isNew && data.id && (
        <div className="space-y-4 pt-6 border-t border-border">
          <h2 className="font-heading text-2xl">Collection Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current items */}
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">
                Current Order ({items.length})
              </p>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No items yet. Add poems from the library.
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item, index) => (
                    <li
                      key={item.videoPoemId}
                      className="flex items-center gap-2 rounded border border-border bg-surface px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, "down")}
                          disabled={index === items.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground w-5 text-center">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm truncate">
                        {item.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePoem(item.videoPoemId)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Available poems */}
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">
                Library ({availablePoems.length})
              </p>
              {availablePoems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {allPoems.length === 0
                    ? "No video poems exist yet."
                    : "All poems are in this collection."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {availablePoems.map((poem) => (
                    <li
                      key={poem.id}
                      className="flex items-center gap-2 rounded border border-border px-3 py-2"
                    >
                      <span className="flex-1 text-sm truncate">
                        {poem.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddPoem(poem.id)}
                        className="text-muted-foreground hover:text-warm-accent transition-colors"
                        aria-label="Add to collection"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
