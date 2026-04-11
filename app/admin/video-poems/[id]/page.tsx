"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createVideoPoem,
  updateVideoPoem,
  deleteVideoPoem,
  removeContentLink,
} from "@/lib/actions";

interface LinkedEssay {
  linkId: number;
  contentId: number;
  title: string;
  type: string;
}

interface VideoPoemData {
  id?: number;
  title: string;
  slug: string;
  vimeoId: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  description: string;
  linkedEssay: LinkedEssay | null;
}

const empty: VideoPoemData = {
  title: "",
  slug: "",
  vimeoId: "",
  thumbnailUrl: "",
  thumbnailAlt: "",
  description: "",
  linkedEssay: null,
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
            description: poem.description,
            linkedEssay: poem.linkedEssay ?? null,
          });
        });
    }
  }, [id, isNew]);

  function set<K extends keyof VideoPoemData>(field: K, value: VideoPoemData[K]) {
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

        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-heading text-xl">Linked Essay</h2>
          {isNew ? (
            <p className="text-xs text-muted-foreground">
              Save this video poem first to link an essay.
            </p>
          ) : data.linkedEssay ? (
            <div className="flex items-center justify-between gap-4 py-2">
              <Link
                href={`/admin/content/${data.linkedEssay.contentId}`}
                className="font-heading text-lg hover:text-warm-accent transition-colors"
              >
                {data.linkedEssay.title}
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (!data.linkedEssay) return;
                  if (!confirm("Remove link to this essay?")) return;
                  await removeContentLink(data.linkedEssay.linkId);
                  setData((prev) => ({ ...prev, linkedEssay: null }));
                  router.refresh();
                }}
              >
                Remove Link
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 py-2">
              <p className="text-xs text-muted-foreground">
                No essay linked yet.
              </p>
              <Link
                href={`/admin/content/new?linkType=video_poem&linkId=${data.id}`}
                className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
              >
                Create Linked Essay
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
