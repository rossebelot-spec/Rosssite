"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateEssay, createEssay, deleteEssay } from "@/lib/actions";

interface EssayData {
  id?: number;
  title: string;
  slug: string;
  bodyHtml: string;
  description: string;
  tags: string;
  published: boolean;
  publishedAt: string;
}

const empty: EssayData = {
  title: "",
  slug: "",
  bodyHtml: "",
  description: "",
  tags: "",
  published: false,
  publishedAt: "",
};

export default function AdminEssayEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<EssayData>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/essays/${id}`)
        .then((r) => r.json())
        .then((essay) => {
          setData({
            id: essay.id,
            title: essay.title,
            slug: essay.slug,
            bodyHtml: essay.bodyHtml,
            description: essay.description,
            tags: essay.tags.join(", "),
            published: essay.published,
            publishedAt: essay.publishedAt
              ? new Date(essay.publishedAt).toISOString().split("T")[0]
              : "",
          });
        });
    }
  }, [id, isNew]);

  function set(field: keyof EssayData, value: string | boolean) {
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
      bodyHtml: data.bodyHtml,
      description: data.description,
      tags: data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      published: data.published,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
    };

    if (isNew) {
      await createEssay(payload);
    } else {
      await updateEssay(data.id!, { ...payload, updatedAt: new Date() });
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this essay?")) return;
    await deleteEssay(data.id);
  }

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">{isNew ? "New Essay" : "Edit Essay"}</h1>
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
            Title
          </label>
          <Input
            value={data.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (isNew) set("slug", slugify(e.target.value));
            }}
            placeholder="Essay title"
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
            Description / Lede
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description shown in listings"
            rows={3}
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Tags (comma separated)
          </label>
          <Input
            value={data.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="environment, poetry, climate"
          />
        </div>

        <div className="flex gap-6 items-center">
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
            Body
          </label>
          <TiptapEditor
            key={id}
            readingTheme
            content={data.bodyHtml}
            onChange={(html) => set("bodyHtml", html)}
          />
        </div>
      </div>
    </div>
  );
}
