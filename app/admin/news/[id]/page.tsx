"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createNewsItem,
  updateNewsItem,
  deleteNewsItem,
  publishNewsItem,
} from "@/lib/actions";

type NewsKind = "coverage" | "announcement" | "story";

interface FormData {
  id?: number;
  kind: NewsKind;
  title: string;
  outlet: string;
  date: string;
  url: string;
  description: string;
  slug: string;
  bodyHtml: string;
}

const empty: FormData = {
  kind: "coverage",
  title: "",
  outlet: "",
  date: "",
  url: "",
  description: "",
  slug: "",
  bodyHtml: "",
};

export default function AdminNewsEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const isValid =
    data.title.trim() !== "" &&
    data.date.trim() !== "" &&
    (data.kind !== "coverage" || data.outlet.trim() !== "") &&
    (data.kind !== "story" || (data.slug.trim() !== "" && data.bodyHtml.trim() !== ""));

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/news/${id}`)
      .then((r) => r.json())
      .then((row) => {
        if (!row?.id) return;
        setData({
          id: row.id,
          kind: (row.kind as NewsKind) ?? "coverage",
          title: row.title ?? "",
          outlet: row.outlet ?? "",
          date: row.date ?? "",
          url: row.url ?? "",
          description: row.description ?? "",
          slug: row.slug ?? "",
          bodyHtml: row.bodyHtml ?? "",
        });
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
      const payload = {
        title: data.title.trim(),
        kind: data.kind,
        outlet: data.outlet.trim(),
        date: data.date.trim(),
        url: data.url.trim() || null,
        description: data.description.trim(),
        slug: data.slug.trim() || null,
        bodyHtml: data.bodyHtml.trim(),
      };
      if (isNew) {
        await createNewsItem(payload);
        router.push("/admin/news");
      } else {
        await updateNewsItem(data.id!, payload);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this news entry?")) return;
    await deleteNewsItem(data.id);
    router.push("/admin/news");
  }

  async function handlePublish() {
    if (!data.id) return;
    setPublishing(true);
    try {
      await publishNewsItem(data.id, !published);
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
            href="/admin/news"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← News
          </Link>
          <h1 className="font-heading text-3xl">
            {isNew ? "New news entry" : "Edit news entry"}
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
            Kind
          </label>
          <select
            value={data.kind}
            onChange={(e) => set("kind", e.target.value as NewsKind)}
            className="h-9 w-full rounded border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="coverage">Coverage (external link)</option>
            <option value="announcement">Announcement</option>
            <option value="story">On-site story (HTML body)</option>
          </select>
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Title
          </label>
          <Input
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Headline"
          />
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Outlet / source{" "}
            {data.kind === "coverage" ? (
              <span className="text-warm-accent">(required)</span>
            ) : (
              <span className="text-muted-foreground">(optional)</span>
            )}
          </label>
          <Input
            value={data.outlet}
            onChange={(e) => set("outlet", e.target.value)}
            placeholder="Publication or program"
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
            URL (optional)
          </label>
          <Input
            value={data.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://…"
          />
        </div>
        {data.kind === "story" && (
          <>
            <div>
              <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
                Slug (URL path)
              </label>
              <Input
                value={data.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="my-post"
              />
            </div>
            <div>
              <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
                Body HTML
              </label>
              <Textarea
                value={data.bodyHtml}
                onChange={(e) => set("bodyHtml", e.target.value)}
                placeholder="Article HTML"
                rows={12}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </>
        )}
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Description (optional)
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short excerpt shown on the public index"
            rows={5}
            className="min-h-[120px]"
          />
        </div>
      </div>
    </div>
  );
}
