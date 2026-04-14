"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createVideo,
  updateVideo,
  publishVideo,
  deleteVideo,
  removeContentLink,
  setVideoCollections,
  setFeaturedHomeVideo,
  clearFeaturedHomeVideo,
  linkEssayToVideo,
} from "@/lib/actions";
import {
  CollectionAssignment,
  type CollectionRef,
} from "@/components/admin/collection-assignment";
import { slugify } from "@/lib/utils";

interface LinkedEssay {
  linkId: number;
  contentId: number;
  title: string;
  type: string;
}

interface UnlinkedEssayOption {
  id: number;
  title: string;
  slug: string;
  type: string;
}

interface VideoData {
  id?: number;
  title: string;
  slug: string;
  vimeoId: string;
  r2Url: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  description: string;
  linkedEssay: LinkedEssay | null;
  isFeaturedForHome?: boolean;
}

const empty: VideoData = {
  title: "",
  slug: "",
  vimeoId: "",
  r2Url: "",
  thumbnailUrl: "",
  thumbnailAlt: "",
  description: "",
  linkedEssay: null,
  isFeaturedForHome: false,
};

export default function AdminVideoEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<VideoData>(empty);
  const [published, setPublished] = useState(false);
  const [memberCollections, setMemberCollections] = useState<CollectionRef[]>([]);
  const [allCollections, setAllCollections] = useState<CollectionRef[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [featuredAction, setFeaturedAction] = useState(false);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [unlinkedEssays, setUnlinkedEssays] = useState<UnlinkedEssayOption[]>([]);
  const [essayPicker, setEssayPicker] = useState("");
  const [linkingEssay, setLinkingEssay] = useState(false);
  const isFormValid =
    data.title.trim() !== "" &&
    data.slug.trim() !== "" &&
    data.vimeoId.trim() !== "";

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/videos/${id}`)
        .then((r) => r.json())
        .then((video) => {
          setData({
            id: video.id,
            title: video.title,
            slug: video.slug,
            vimeoId: video.vimeoId,
            r2Url: video.r2Url ?? "",
            thumbnailUrl: video.thumbnailUrl,
            thumbnailAlt: video.thumbnailAlt,
            description: video.description,
            linkedEssay: video.linkedEssay ?? null,
          });
          setPublished(video.published ?? false);
          setMemberCollections(video.memberCollections ?? []);
          setData((d) => ({
            ...d,
            isFeaturedForHome: Boolean(video.isFeaturedForHome),
          }));
        });
    }
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then((rows) => { if (Array.isArray(rows)) setAllCollections(rows); });
  }, [id, isNew]);

  useEffect(() => {
    if (isNew || !data.id || data.linkedEssay) {
      setUnlinkedEssays([]);
      return;
    }
    let cancelled = false;
    fetch("/api/admin/content/unlinked-for-video")
      .then((r) => r.json())
      .then((payload: { items?: UnlinkedEssayOption[] }) => {
        if (cancelled) return;
        if (Array.isArray(payload.items)) setUnlinkedEssays(payload.items);
      })
      .catch(() => {
        if (!cancelled) setUnlinkedEssays([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isNew, data.id, data.linkedEssay]);

  function set<K extends keyof VideoData>(field: K, value: VideoData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        title: data.title,
        slug: data.slug,
        vimeoId: data.vimeoId,
        r2Url: data.r2Url.trim() || null,
        thumbnailUrl: data.thumbnailUrl,
        thumbnailAlt: data.thumbnailAlt,
        description: data.description,
      };

      if (isNew) {
        await createVideo({
          ...payload,
          collectionIds: memberCollections.map((c) => c.id),
        });
      } else {
        await updateVideo(data.id!, { ...payload, updatedAt: new Date() });
        await setVideoCollections({
          videoId: data.id!,
          collectionIds: memberCollections.map((c) => c.id),
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!data.id) return;
    setPublishing(true);
    try {
      await publishVideo(data.id, !published);
      const nextPublished = !published;
      setPublished(nextPublished);
      if (!nextPublished) {
        setData((d) => ({ ...d, isFeaturedForHome: false }));
      }
    } finally {
      setPublishing(false);
    }
  }

  async function handleFeatureHome() {
    if (!data.id) return;
    setFeaturedError(null);
    setFeaturedAction(true);
    try {
      await setFeaturedHomeVideo(data.id);
      setData((d) => ({ ...d, isFeaturedForHome: true }));
    } catch (e) {
      setFeaturedError(e instanceof Error ? e.message : "Could not update featured video.");
    } finally {
      setFeaturedAction(false);
    }
  }

  async function handleUnfeatureHome() {
    if (!data.id) return;
    setFeaturedError(null);
    setFeaturedAction(true);
    try {
      await clearFeaturedHomeVideo(data.id);
      setData((d) => ({ ...d, isFeaturedForHome: false }));
    } catch (e) {
      setFeaturedError(e instanceof Error ? e.message : "Could not update featured video.");
    } finally {
      setFeaturedAction(false);
    }
  }

  async function handleDelete() {
    if (!data.id || !confirm("Delete this video?")) return;
    await deleteVideo(data.id);
  }

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl">
            {isNew ? "New Video" : "Edit Video"}
          </h1>
          {!isNew && (
            <span className={`text-xs tracking-widest uppercase px-2 py-0.5 border ${published ? "border-green-600 text-green-600" : "border-muted-foreground text-muted-foreground"}`}>
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
                disabled={publishing || !isFormValid}
              >
                {publishing ? (published ? "Unpublishing…" : "Publishing…") : (published ? "Unpublish" : "Publish")}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !isFormValid}>
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
            placeholder="Video title"
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

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            R2 URL (optional — overrides Vimeo)
          </label>
          <Input
            value={data.r2Url}
            onChange={(e) => set("r2Url", e.target.value)}
            placeholder="https://…"
          />
        </div>

        {(data.r2Url.trim() || data.vimeoId) && (
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">
              Preview
            </label>
            <div className="relative w-full aspect-video rounded overflow-hidden border border-border bg-black">
              {data.r2Url.trim() ? (
                <video
                  src={data.r2Url.trim()}
                  controls
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <iframe
                  src={`https://player.vimeo.com/video/${data.vimeoId}?dnt=1&title=0&byline=0&portrait=0`}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}
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

        {!isNew && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="font-heading text-xl">Home page</h2>
            <p className="text-xs text-muted-foreground max-w-md">
              Only one video can appear in the site hero and “Featured video” column on the home
              page. Choosing another video here moves the feature to that video.
            </p>
            {featuredError ? (
              <p className="text-xs text-destructive" role="alert">
                {featuredError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  featuredAction ||
                  !published ||
                  Boolean(data.isFeaturedForHome)
                }
                onClick={handleFeatureHome}
              >
                {featuredAction && data.isFeaturedForHome === false
                  ? "Updating…"
                  : "Feature on home page"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={featuredAction || !data.isFeaturedForHome}
                onClick={handleUnfeatureHome}
              >
                {featuredAction && data.isFeaturedForHome ? "Updating…" : "Remove from home page"}
              </Button>
              {!published ? (
                <span className="text-xs text-muted-foreground">Publish this video to feature it.</span>
              ) : data.isFeaturedForHome ? (
                <span className="text-xs text-muted-foreground">Currently featured on the home page.</span>
              ) : null}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-heading text-xl">Collections</h2>
          <CollectionAssignment
            linkedType="video"
            linkedId={isNew ? null : (data.id ?? null)}
            staging={isNew}
            value={memberCollections}
            allCollections={allCollections}
            onChange={setMemberCollections}
            onCollectionCreated={(coll) =>
              setAllCollections((prev) =>
                prev.some((c) => c.id === coll.id) ? prev : [...prev, coll]
              )
            }
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-heading text-xl">Linked Essay</h2>
          {isNew ? (
            <p className="text-xs text-muted-foreground">
              Save this video first to link an essay.
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
            <div className="space-y-3 max-w-md">
              <p className="text-xs text-muted-foreground">
                No essay linked yet. Create a new piece or choose an existing essay that is
                not already attached to a video.
              </p>
              <div>
                <label
                  htmlFor="video-essay-picker"
                  className="text-xs tracking-widest uppercase text-muted-foreground block mb-2"
                >
                  Link or create
                </label>
                <select
                  id="video-essay-picker"
                  className="h-9 w-full max-w-md rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 disabled:opacity-50"
                  value={essayPicker}
                  disabled={linkingEssay}
                  onChange={async (e) => {
                    const v = e.target.value;
                    setEssayPicker("");
                    if (!v || !data.id) return;
                    if (v === "new") {
                      router.push(
                        `/admin/content/new?linkType=video&linkId=${data.id}`
                      );
                      return;
                    }
                    const contentId = parseInt(v, 10);
                    if (!Number.isFinite(contentId)) return;
                    setLinkingEssay(true);
                    try {
                      await linkEssayToVideo({
                        videoId: data.id,
                        contentId,
                      });
                      const video = await fetch(`/api/admin/videos/${data.id}`).then(
                        (r) => r.json()
                      );
                      setData((prev) => ({
                        ...prev,
                        linkedEssay: video.linkedEssay ?? null,
                      }));
                      router.refresh();
                    } catch (err) {
                      alert(
                        err instanceof Error
                          ? err.message
                          : "Could not link essay."
                      );
                    } finally {
                      setLinkingEssay(false);
                    }
                  }}
                >
                  <option value="">Choose…</option>
                  <option value="new">Create new essay…</option>
                  {unlinkedEssays.map((row) => (
                    <option key={row.id} value={String(row.id)}>
                      {row.title}
                      {row.type === "blog" ? " (blog)" : ""}
                    </option>
                  ))}
                </select>
                {linkingEssay ? (
                  <p className="text-xs text-muted-foreground mt-2">Linking…</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
