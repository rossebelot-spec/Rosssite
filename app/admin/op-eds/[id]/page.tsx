"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createOpEd, updateOpEd, deleteOpEd } from "@/lib/actions";

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

  const isValid =
    data.title.trim() !== "" &&
    data.url.trim() !== "" &&
    data.date.trim() !== "" &&
    (data.collectionId !== null || data.publication.trim() !== "");

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
          setData({
            id: article.id,
            collectionId: article.collectionId ?? null,
            publication: article.publication ?? "",
            title: article.title,
            url: article.url,
            date: article.date,
            summary: article.summary ?? "",
            pullQuote: article.pullQuote ?? "",
            thumbnailUrl: article.thumbnailUrl ?? "",
            displayOrder: article.displayOrder ?? 0,
          });
        });
    }
  }, [id, isNew]);

  function set<K extends keyof ArticleData>(field: K, value: ArticleData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
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
        </div>
        <div className="flex gap-3">
          {!isNew && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
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
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Collection (Publication)
          </label>
          <select
            value={data.collectionId ?? ""}
            onChange={(e) =>
              set("collectionId", e.target.value ? Number(e.target.value) : null)
            }
            className="w-full bg-background border border-border text-foreground text-sm px-3 py-2 rounded"
          >
            <option value="">— Standalone (no collection) —</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.publication}
              </option>
            ))}
          </select>
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
            Thumbnail URL
          </label>
          <Input
            value={data.thumbnailUrl}
            onChange={(e) => set("thumbnailUrl", e.target.value)}
            placeholder="https://…"
          />
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
