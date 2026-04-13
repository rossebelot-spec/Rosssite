"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createOpEd,
  updateOpEd,
  deleteOpEd,
  deleteUploadedBlobUrl,
  publishOpEd,
  createOpEdCollection,
} from "@/lib/actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import { slugify } from "@/lib/utils";

interface CollectionRef {
  id: number;
  publication: string;
  slug: string;
}

interface ArticleData {
  id?: number;
  collectionId: number | null;
  publication: string;
  title: string;
  url: string;
  date: string;
  summary: string;
  pullQuote: string;
  thumbnailUrl: string;
  displayOrder: number;
}

const empty: ArticleData = {
  collectionId: null,
  publication: "",
  title: "",
  url: "",
  date: "",
  summary: "",
  pullQuote: "",
  thumbnailUrl: "",
  displayOrder: 0,
};

export default function AdminOpEdEditor() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<ArticleData>({
    ...empty,
    collectionId: searchParams.get("collectionId")
      ? Number(searchParams.get("collectionId"))
      : null,
  });
  const [collections, setCollections] = useState<CollectionRef[]>([]);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  /** DB thumbnail when the form was loaded; never delete this blob on client until save removes it. */
  const [initialThumbnailUrl, setInitialThumbnailUrl] = useState("");
  const [collPick, setCollPick] = useState("");
  const [addingCollection, setAddingCollection] = useState(false);
  const [newCollPublication, setNewCollPublication] = useState("");
  const [newCollSlug, setNewCollSlug] = useState("");
  const [newCollMastheadUrl, setNewCollMastheadUrl] = useState("");
  const [initialNewCollMasthead, setInitialNewCollMasthead] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);

  const isValid =
    data.title.trim() !== "" &&
    data.url.trim() !== "" &&
    data.date.trim() !== "" &&
    (data.collectionId !== null || data.publication.trim() !== "");

  useEffect(() => {
    setCollPick(
      data.collectionId != null ? String(data.collectionId) : ""
    );
  }, [data.collectionId]);

  useEffect(() => {
    fetch("/api/admin/op-ed-collections")
      .then((r) => r.json())
      .then((rows) => {
        if (Array.isArray(rows)) setCollections(rows);
      });

    if (!isNew) {
      fetch(`/api/admin/op-eds/${id}`)
        .then((r) => r.json())
        .then((article) => {
          const thumb = article.thumbnailUrl ?? "";
          setData({
            id: article.id,
            collectionId: article.collectionId ?? null,
            publication: article.publication ?? "",
            title: article.title,
            url: article.url,
            date: article.date,
            summary: article.summary ?? "",
            pullQuote: article.pullQuote ?? "",
            thumbnailUrl: thumb,
            displayOrder: article.displayOrder ?? 0,
          });
          setInitialThumbnailUrl(thumb);
          setPublished(article.published ?? false);
        });
    }
  }, [id, isNew]);

  function set<K extends keyof ArticleData>(field: K, value: ArticleData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleThumbnailUpload(url: string) {
    const prev = data.thumbnailUrl;
    if (
      prev &&
      prev !== url &&
      prev !== initialThumbnailUrl &&
      prev.includes(".blob.vercel-storage.com")
    ) {
      await deleteUploadedBlobUrl(prev);
    }
    set("thumbnailUrl", url);
  }

  async function handleRemoveThumbnail() {
    const prev = data.thumbnailUrl;
    if (
      prev &&
      prev !== initialThumbnailUrl &&
      prev.includes(".blob.vercel-storage.com")
    ) {
      await deleteUploadedBlobUrl(prev);
    }
    set("thumbnailUrl", "");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        collectionId: data.collectionId,
        publication:
          data.collectionId !== null
            ? (collections.find((c) => c.id === data.collectionId)
                ?.publication ?? data.publication)
            : data.publication.trim(),
        title: data.title.trim(),
        url: data.url.trim(),
        date: data.date.trim(),
        summary: data.summary.trim(),
        pullQuote: data.pullQuote.trim() || null,
        thumbnailUrl: data.thumbnailUrl.trim() || null,
        displayOrder: data.displayOrder,
      };
      if (isNew) {
        await createOpEd(payload);
        router.push("/admin/op-eds");
      } else {
        await updateOpEd(data.id!, payload);
        setInitialThumbnailUrl(payload.thumbnailUrl ?? "");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this article?")) return;
    await deleteOpEd(data.id);
    router.push("/admin/op-eds");
  }

  async function handlePublish() {
    if (!data.id) return;
    setPublishing(true);
    try {
      await publishOpEd(data.id, !published);
      setPublished(!published);
    } finally {
      setPublishing(false);
    }
  }

  async function handleNewCollMastheadUpload(url: string) {
    const prev = newCollMastheadUrl;
    if (
      prev &&
      prev !== url &&
      prev !== initialNewCollMasthead &&
      prev.includes(".blob.vercel-storage.com")
    ) {
      await deleteUploadedBlobUrl(prev);
    }
    setNewCollMastheadUrl(url);
  }

  async function clearNewCollMasthead() {
    const prev = newCollMastheadUrl;
    if (
      prev &&
      prev !== initialNewCollMasthead &&
      prev.includes(".blob.vercel-storage.com")
    ) {
      await deleteUploadedBlobUrl(prev);
    }
    setNewCollMastheadUrl("");
  }

  async function handleCreateInlineCollection() {
    const pub = newCollPublication.trim();
    if (!pub) return;
    const slug = newCollSlug.trim() || slugify(pub);
    if (!slug) return;
    setCreatingCollection(true);
    try {
      const created = await createOpEdCollection({
        publication: pub,
        slug,
        mastheadUrl: newCollMastheadUrl.trim() || null,
      });
      setCollections((prev) =>
        [...prev, { id: created.id, publication: created.publication, slug: created.slug }].sort(
          (a, b) => a.publication.localeCompare(b.publication)
        )
      );
      set("collectionId", created.id);
      setCollPick(String(created.id));
      setAddingCollection(false);
      setNewCollPublication("");
      setNewCollSlug("");
      setNewCollMastheadUrl("");
      setInitialNewCollMasthead("");
    } catch (err) {
      console.error(err);
      window.alert(
        err instanceof Error ? err.message : "Could not create collection (slug may already exist)."
      );
    } finally {
      setCreatingCollection(false);
    }
  }

  function cancelNewCollection() {
    if (newCollMastheadUrl && newCollMastheadUrl.includes(".blob.vercel-storage.com")) {
      void deleteUploadedBlobUrl(newCollMastheadUrl);
    }
    setAddingCollection(false);
    setNewCollPublication("");
    setNewCollSlug("");
    setNewCollMastheadUrl("");
    setInitialNewCollMasthead("");
    setCollPick(data.collectionId != null ? String(data.collectionId) : "");
  }

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/op-eds"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Op-eds
          </Link>
          <h1 className="font-heading text-3xl">
            {isNew ? "New Article" : "Edit Article"}
          </h1>
          {!isNew && (
            <span
              className={`text-xs tracking-widest uppercase px-2 py-0.5 border ${
                published
                  ? "border-green-600 text-green-600"
                  : "border-muted-foreground text-muted-foreground"
              }`}
            >
              {published ? "Published" : "Draft"}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {!isNew && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePublish}
                disabled={publishing || !isValid}
              >
                {publishing
                  ? published
                    ? "Unpublishing…"
                    : "Publishing…"
                  : published
                    ? "Unpublish"
                    : "Publish"}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !isValid}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Title
          </label>
          <Input
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Article title"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            URL
          </label>
          <Input
            value={data.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Date
          </label>
          <Input
            type="date"
            value={data.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-xs tracking-widest uppercase text-muted-foreground">
              Collection (Publication)
            </label>
            <Link
              href="/admin/op-ed-collections/new"
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-warm-accent transition-colors"
            >
              New collection (full editor)
            </Link>
          </div>
          <select
            value={collPick}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__new__") {
                setAddingCollection(true);
                setCollPick(
                  data.collectionId != null ? String(data.collectionId) : ""
                );
                return;
              }
              setCollPick(v);
              set("collectionId", v === "" ? null : Number(v));
            }}
            className="w-full bg-background border border-border text-foreground text-sm px-3 py-2 rounded"
          >
            <option value="">— Standalone (no collection) —</option>
            {collections.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.publication}
              </option>
            ))}
            <option value="__new__">+ New collection…</option>
          </select>
          {addingCollection ? (
            <div className="mt-4 space-y-3 p-4 border border-border rounded-md bg-surface">
              <p className="text-xs text-muted-foreground">
                Create a publication collection. You can edit the masthead and description later in{" "}
                <Link href="/admin/op-ed-collections" className="underline hover:text-warm-accent">
                  Op-ed Collections
                </Link>
                .
              </p>
              <div>
                <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
                  Publication name
                </label>
                <Input
                  value={newCollPublication}
                  onChange={(e) => {
                    setNewCollPublication(e.target.value);
                    setNewCollSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Canada's National Observer"
                />
              </div>
              <div>
                <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
                  Slug
                </label>
                <Input
                  value={newCollSlug}
                  onChange={(e) => setNewCollSlug(e.target.value)}
                  placeholder="national-observer"
                />
              </div>
              <div>
                <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
                  Masthead (JPEG, optional)
                </label>
                <ImageUploader
                  accept="image/jpeg,.jpg,.jpeg"
                  existingUrl={newCollMastheadUrl || undefined}
                  onUpload={handleNewCollMastheadUpload}
                />
                {newCollMastheadUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => void clearNewCollMasthead()}
                  >
                    Remove masthead
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleCreateInlineCollection()}
                  disabled={creatingCollection || !newCollPublication.trim()}
                >
                  {creatingCollection ? "Creating…" : "Create collection"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelNewCollection}
                  disabled={creatingCollection}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {data.collectionId === null && (
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              Publication Name (standalone)
            </label>
            <Input
              value={data.publication}
              onChange={(e) => set("publication", e.target.value)}
              placeholder="Maclean's"
            />
          </div>
        )}

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Thumbnail (JPEG)
          </label>
          <p className="text-muted-foreground text-sm mb-3">
            Upload a square cover image for listing cards. Stored on Vercel Blob.
          </p>
          <ImageUploader
            accept="image/jpeg,.jpg,.jpeg"
            existingUrl={data.thumbnailUrl || undefined}
            onUpload={handleThumbnailUpload}
          />
          {data.thumbnailUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={handleRemoveThumbnail}
            >
              Remove thumbnail
            </Button>
          ) : null}
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Pull Quote
          </label>
          <Textarea
            value={data.pullQuote}
            onChange={(e) => set("pullQuote", e.target.value)}
            placeholder="A memorable quote from the article"
            rows={2}
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Summary
          </label>
          <Textarea
            value={data.summary}
            onChange={(e) => set("summary", e.target.value)}
            placeholder="Short description for listings and metadata"
            rows={3}
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Display Order
          </label>
          <Input
            type="number"
            value={data.displayOrder}
            onChange={(e) => set("displayOrder", Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
