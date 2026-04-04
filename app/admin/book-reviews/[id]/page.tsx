"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateBookReview, createBookReview, deleteBookReview } from "@/lib/actions";

interface ReviewData {
  id?: number;
  title: string;
  slug: string;
  author: string;
  bodyHtml: string;
  description: string;
  rating: string;
  published: boolean;
  publishedAt: string;
}

const empty: ReviewData = {
  title: "",
  slug: "",
  author: "",
  bodyHtml: "",
  description: "",
  rating: "",
  published: false,
  publishedAt: "",
};

export default function AdminBookReviewEditor() {
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<ReviewData>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/book-reviews/${id}`)
        .then((r) => r.json())
        .then((review) => {
          setData({
            id: review.id,
            title: review.title,
            slug: review.slug,
            author: review.author,
            bodyHtml: review.bodyHtml,
            description: review.description,
            rating: review.rating?.toString() ?? "",
            published: review.published,
            publishedAt: review.publishedAt
              ? new Date(review.publishedAt).toISOString().split("T")[0]
              : "",
          });
        });
    }
  }, [id, isNew]);

  function set(field: keyof ReviewData, value: string | boolean) {
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
      author: data.author,
      bodyHtml: data.bodyHtml,
      description: data.description,
      rating: data.rating ? parseInt(data.rating, 10) : null,
      published: data.published,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
    };

    if (isNew) {
      await createBookReview(payload);
    } else {
      await updateBookReview(data.id!, { ...payload, updatedAt: new Date() });
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this review?")) return;
    await deleteBookReview(data.id);
  }

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">{isNew ? "New Review" : "Edit Review"}</h1>
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

      <div className="space-y-4">
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Book Title
          </label>
          <Input
            value={data.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (isNew) set("slug", slugify(e.target.value));
            }}
            placeholder="Book title"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Author
          </label>
          <Input
            value={data.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="Author name"
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
            placeholder="Short description shown in listings"
            rows={3}
          />
        </div>

        <div className="flex gap-6 items-end">
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              Rating (1–5)
            </label>
            <Input
              type="number"
              min="1"
              max="5"
              value={data.rating}
              onChange={(e) => set("rating", e.target.value)}
              className="w-24"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              Publish date
            </label>
            <Input
              type="date"
              value={data.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
              className="w-44"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-1">
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
            Body
          </label>
          <TiptapEditor
            content={data.bodyHtml}
            onChange={(html) => set("bodyHtml", html)}
          />
        </div>
      </div>
    </div>
  );
}
