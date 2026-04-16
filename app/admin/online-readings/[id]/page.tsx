"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/admin/image-uploader";
import {
  createOnlineReading,
  updateOnlineReading,
  deleteOnlineReading,
  publishOnlineReading,
} from "@/lib/actions";

const PLATFORMS = ["youtube", "vimeo", "tiktok", "r2"] as const;

interface FormData {
  id?: number;
  title: string;
  date: string;
  platform: string;
  externalUrl: string;
  r2Url: string;
  thumbnailUrl: string;
  description: string;
}

const empty: FormData = {
  title: "",
  date: "",
  platform: "youtube",
  externalUrl: "",
  r2Url: "",
  thumbnailUrl: "",
  description: "",
};

export default function AdminOnlineReadingEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const isValid = data.title.trim() !== "" && data.date.trim() !== "";

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/online-readings/${id}`)
      .then((r) => r.json())
      .then((row) => {
        if (!row?.id) return;
        setData({
          id: row.id,
          title: row.title ?? "",
          date: row.date ?? "",
          platform: row.platform ?? "youtube",
          externalUrl: row.externalUrl ?? "",
          r2Url: row.r2Url ?? "",
          thumbnailUrl: row.thumbnailUrl ?? "",
          description: row.description ?? "",
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
        date: data.date.trim(),
        platform: data.platform,
        externalUrl: data.externalUrl.trim() || null,
        r2Url: data.r2Url.trim() || null,
        thumbnailUrl: data.thumbnailUrl.trim(),
        description: data.description.trim(),
      };
      if (isNew) {
        await createOnlineReading(payload);
        router.push("/admin/online-readings");
      } else {
        await updateOnlineReading(data.id!, payload);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this reading?")) return;
    await deleteOnlineReading(data.id);
    router.push("/admin/online-readings");
  }

  async function handlePublish() {
    if (!data.id) return;
    setPublishing(true);
    try {
      await publishOnlineReading(data.id, !published);
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
            href="/admin/online-readings"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Online Readings
          </Link>
          <h1 className="font-heading text-3xl">
            {isNew ? "New reading" : "Edit reading"}
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
            placeholder="Reading or appearance title"
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
            Platform
          </label>
          <div className="flex gap-3">
            {PLATFORMS.map((p) => (
              <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="platform"
                  value={p}
                  checked={data.platform === p}
                  onChange={() => set("platform", p)}
                  className="accent-warm-accent"
                />
                <span className="text-sm">{p === "r2" ? "Self-hosted (R2)" : p === "tiktok" ? "TikTok" : p.charAt(0).toUpperCase() + p.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>

        {data.platform !== "r2" && (
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              {data.platform === "youtube"
                ? "YouTube URL"
                : data.platform === "vimeo"
                  ? "Vimeo URL"
                  : "TikTok URL"}
            </label>
            <Input
              value={data.externalUrl}
              onChange={(e) => set("externalUrl", e.target.value)}
              placeholder={
                data.platform === "youtube"
                  ? "https://www.youtube.com/watch?v=..."
                  : data.platform === "vimeo"
                    ? "https://vimeo.com/..."
                    : "https://www.tiktok.com/@..."
              }
            />
            {data.platform === "youtube" && !data.thumbnailUrl && (
              <p className="text-xs text-muted-foreground mt-1">
                Thumbnail auto-derived from YouTube if left blank below.
              </p>
            )}
          </div>
        )}

        {data.platform === "r2" && (
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              R2 Video URL (public MP4)
            </label>
            <Input
              value={data.r2Url}
              onChange={(e) => set("r2Url", e.target.value)}
              placeholder="https://pub-xxx.r2.dev/readings/..."
            />
          </div>
        )}

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">
            Thumbnail (optional)
          </label>
          <ImageUploader
            existingUrl={data.thumbnailUrl || undefined}
            onUpload={(url) => set("thumbnailUrl", url)}
          />
          {data.platform === "youtube" && !data.thumbnailUrl && (
            <p className="text-xs text-muted-foreground mt-2">
              Leave blank to auto-derive from the YouTube video ID.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Description (optional)
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Series, host, context…"
            rows={4}
            className="min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}
