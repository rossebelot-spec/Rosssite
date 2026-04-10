"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createVideoPoem,
  updateVideoPoem,
  deleteVideoPoem,
} from "@/lib/actions";

interface VideoPoemData {
  id?: number;
  title: string;
  slug: string;
  vimeoId: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  essayHtml: string;
  description: string;
}

const empty: VideoPoemData = {
  title: "",
  slug: "",
  vimeoId: "",
  thumbnailUrl: "",
  thumbnailAlt: "",
  essayHtml: "",
  description: "",
};

export default function AdminVideoPoemEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<VideoPoemData>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/video-poems/${id}`)
        .then((r) => r.json())
        .then((poem) => {
          setData({
            id: poem.id,
            title: poem.title,
            slug: poem.slug,
            vimeoId: poem.vimeoId,
            thumbnailUrl: poem.thumbnailUrl,
            thumbnailAlt: poem.thumbnailAlt,
            essayHtml: poem.essayHtml,
            description: poem.description,
          });
        });
    }
  }, [id, isNew]);

  function set(field: keyof VideoPoemData, value: string | boolean) {
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
      vimeoId: data.vimeoId,
      thumbnailUrl: data.thumbnailUrl,
      thumbnailAlt: data.thumbnailAlt,
      essayHtml: data.essayHtml,
      description: data.description,
    };

    if (isNew) {
      await createVideoPoem(payload);
    } else {
      await updateVideoPoem(data.id!, { ...payload, updatedAt: new Date() });
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this video poem?")) return;
    await deleteVideoPoem(data.id);
  }

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">
          {isNew ? "New Video Poem" : "Edit Video Poem"}
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
            placeholder="Video poem title"
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
            Vimeo ID
          </label>
          <Input
            value={data.vimeoId}
            onChange={(e) => set("vimeoId", e.target.value)}
            placeholder="Bare numeric ID only (e.g. 123456789)"
          />
        </div>

        {data.vimeoId && (
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">
              Preview
            </label>
            <div className="relative w-full aspect-video rounded overflow-hidden border border-border">
              <iframe
                src={`https://player.vimeo.com/video/${data.vimeoId}?dnt=1&title=0&byline=0&portrait=0`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Description
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description for meta/listings"
            rows={3}
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">
            Thumbnail (16:9)
          </label>
          <ImageUploader
            existingUrl={data.thumbnailUrl || undefined}
            onUpload={(url) => set("thumbnailUrl", url)}
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Thumbnail Alt Text
          </label>
          <Input
            value={data.thumbnailAlt}
            onChange={(e) => set("thumbnailAlt", e.target.value)}
            placeholder="Describe the thumbnail image"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">
            Essay
          </label>
          <TiptapEditor
            key={`video-poem-${id}`}
            readingTheme
            content={data.essayHtml}
            onChange={(html) => set("essayHtml", html)}
          />
        </div>
      </div>
    </div>
  );
}
