"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createBook,
  updateBook,
  deleteBook,
  publishBook,
  deleteUploadedBlobUrl,
} from "@/lib/actions";
import { ImageUploader } from "@/components/admin/image-uploader";

interface FormData {
  id?: number;
  title: string;
  subtitle: string;
  publisher: string;
  year: string;
  description: string;
  coverImageUrl: string;
  buyUrl: string;
  isbn: string;
  displayOrder: string;
}

const empty: FormData = {
  title: "",
  subtitle: "",
  publisher: "",
  year: "",
  description: "",
  coverImageUrl: "",
  buyUrl: "",
  isbn: "",
  displayOrder: "0",
};

export default function AdminBookEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [initialCoverUrl, setInitialCoverUrl] = useState("");

  const isValid =
    data.title.trim() !== "" &&
    data.publisher.trim() !== "" &&
    data.year.trim() !== "";

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/books/${id}`)
      .then((r) => r.json())
      .then((row) => {
        if (!row?.id) return;
        setData({
          id: row.id,
          title: row.title ?? "",
          subtitle: row.subtitle ?? "",
          publisher: row.publisher ?? "",
          year: String(row.year ?? ""),
          description: row.description ?? "",
          coverImageUrl: row.coverImageUrl ?? "",
          buyUrl: row.buyUrl ?? "",
          isbn: row.isbn ?? "",
          displayOrder: String(row.displayOrder ?? 0),
        });
        setInitialCoverUrl(row.coverImageUrl ?? "");
        setPublished(row.published ?? false);
      });
  }, [id, isNew]);

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      // If cover image changed, clean up old blob
      if (!isNew && initialCoverUrl && initialCoverUrl !== data.coverImageUrl) {
        await deleteUploadedBlobUrl(initialCoverUrl);
      }
      const payload = {
        title: data.title.trim(),
        subtitle: data.subtitle.trim(),
        publisher: data.publisher.trim(),
        year: parseInt(data.year, 10),
        description: data.description.trim(),
        coverImageUrl: data.coverImageUrl.trim() || null,
        buyUrl: data.buyUrl.trim() || null,
        isbn: data.isbn.trim(),
        displayOrder: parseInt(data.displayOrder, 10) || 0,
      };
      if (isNew) {
        await createBook(payload);
        router.push("/admin/books");
      } else {
        await updateBook(data.id!, payload);
        setInitialCoverUrl(data.coverImageUrl);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this book?")) return;
    if (data.coverImageUrl) {
      await deleteUploadedBlobUrl(data.coverImageUrl);
    }
    await deleteBook(data.id);
    router.push("/admin/books");
  }

  async function handlePublish() {
    if (!data.id) return;
    setPublishing(true);
    try {
      await publishBook(data.id, !published);
      setPublished(!published);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/books"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Books
          </Link>
          <h1 className="font-heading text-3xl">
            {isNew ? "New book" : "Edit book"}
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
            Title *
          </label>
          <Input
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Book title"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Subtitle
          </label>
          <Input
            value={data.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="Optional subtitle"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              Publisher *
            </label>
            <Input
              value={data.publisher}
              onChange={(e) => set("publisher", e.target.value)}
              placeholder="e.g. Wolsak & Wynn"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              Year *
            </label>
            <Input
              type="number"
              value={data.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="e.g. 2020"
            />
          </div>
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Cover image
          </label>
          <ImageUploader
            existingUrl={data.coverImageUrl || undefined}
            onUpload={(url) => set("coverImageUrl", url)}
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Buy link
          </label>
          <Input
            value={data.buyUrl}
            onChange={(e) => set("buyUrl", e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            ISBN
          </label>
          <Input
            value={data.isbn}
            onChange={(e) => set("isbn", e.target.value)}
            placeholder="978-…"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Description
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief note about the collection…"
            rows={6}
            className="min-h-[140px]"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Display order
          </label>
          <Input
            type="number"
            value={data.displayOrder}
            onChange={(e) => set("displayOrder", e.target.value)}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
