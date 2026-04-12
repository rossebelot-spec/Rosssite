"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createContent,
  updateContent,
  deleteContent,
  addContentLink,
  removeContentLink,
} from "@/lib/actions";
import type { ContentType } from "@/db/schema";

interface LinkItem {
  id: number;
  videoId?: number;
  videoTitle?: string;
  collectionId?: number;
  collectionTitle?: string;
}

interface DropdownItem {
  id: number;
  title: string;
  slug: string;
}

interface EditorState {
  type: ContentType;
  title: string;
  slug: string;
  topic: string;
  bodyHtml: string;
  description: string;
  tags: string;
  published: boolean;
  publishedAt: string;
  links: LinkItem[];
  videos: DropdownItem[];
  collections: DropdownItem[];
  pendingLinkType: "video" | "collection" | "";
  pendingLinkId: number | "";
}

const empty: EditorState = {
  type: "essay",
  title: "",
  slug: "",
  topic: "",
  bodyHtml: "",
  description: "",
  tags: "",
  published: false,
  publishedAt: "",
  links: [],
  videos: [],
  collections: [],
  pendingLinkType: "",
  pendingLinkId: "",
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminContentEditor() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [data, setData] = useState<EditorState>(empty);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Deep-link params: ?linkType=video_poem&linkId=123
  const deepLinkType = searchParams.get("linkType");
  const deepLinkId = searchParams.get("linkId");
  const hasDeepLink =
    isNew &&
    (deepLinkType === "video" || deepLinkType === "collection") &&
    deepLinkId != null &&
    !Number.isNaN(Number(deepLinkId));

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/content/${id}`)
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        const row = payload.content;
        setData((prev) => ({
          ...prev,
          type: row?.type ?? (hasDeepLink ? "essay" : prev.type),
          title: row?.title ?? "",
          slug: row?.slug ?? "",
          topic: row?.topic ?? "",
          bodyHtml: row?.bodyHtml ?? "",
          description: row?.description ?? "",
          tags: Array.isArray(row?.tags) ? row.tags.join(", ") : "",
          published: row?.published ?? false,
          publishedAt: toDateInputValue(row?.publishedAt),
          links: payload.links ?? [],
          videos: payload.videos ?? [],
          collections: payload.collections ?? [],
          pendingLinkType: hasDeepLink
            ? (deepLinkType as "video" | "collection")
            : "",
          pendingLinkId: hasDeepLink ? Number(deepLinkId) : "",
        }));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function set<K extends keyof EditorState>(field: K, value: EditorState[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  const showsTopic = data.type !== "essay" && data.type !== "blog";
  const topicLabel =
    data.type === "review"
      ? "Author"
      : data.type === "event"
      ? "Event Name"
      : "Topic";
  const topicPlaceholder =
    data.type === "review"
      ? "Jane Smith"
      : data.type === "event"
      ? "Event name"
      : "Topic";

  async function handleSave() {
    setSaving(true);
    const tags = data.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const publishedAt =
      data.published && data.publishedAt ? new Date(data.publishedAt) : null;
    const topic = showsTopic ? data.topic : "";

    try {
      if (isNew) {
        const pendingLink =
          hasDeepLink && data.pendingLinkId !== ""
            ? data.pendingLinkType === "video"
              ? { videoId: Number(data.pendingLinkId) }
              : { collectionId: Number(data.pendingLinkId) }
            : undefined;
        await createContent({
          type: data.type,
          title: data.title,
          slug: data.slug,
          topic,
          bodyHtml: data.bodyHtml,
          description: data.description,
          tags,
          published: data.published,
          publishedAt,
          pendingLink,
        });
        // createContent redirects on success
      } else {
        await updateContent(Number(id), {
          type: data.type,
          title: data.title,
          slug: data.slug,
          topic,
          bodyHtml: data.bodyHtml,
          description: data.description,
          tags,
          published: data.published,
          publishedAt,
          updatedAt: new Date(),
        });
        setSaving(false);
      }
    } catch (err) {
      // Next.js server actions throw NEXT_REDIRECT for redirect() — ignore it
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest?: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        return;
      }
      setSaving(false);
      throw err;
    }
  }

  async function handlePublish() {
    if (isNew) return;
    const nextPublished = !data.published;
    setPublishing(true);
    try {
      const publishedAt = nextPublished
        ? data.publishedAt
          ? new Date(data.publishedAt)
          : new Date()
        : null;
      await updateContent(Number(id), {
        published: nextPublished,
        publishedAt,
        updatedAt: new Date(),
      });
      setData((prev) => ({
        ...prev,
        published: nextPublished,
        publishedAt: publishedAt ? toDateInputValue(publishedAt.toISOString()) : "",
      }));
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (isNew || !confirm("Delete this content?")) return;
    await deleteContent(Number(id));
  }

  async function handleRemoveLink(linkId: number) {
    await removeContentLink(linkId);
    setData((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== linkId),
    }));
    router.refresh();
  }

  async function handleAddLink() {
    if (isNew || !data.pendingLinkType || data.pendingLinkId === "") return;
    const payload: {
      contentId: number;
      videoId?: number;
      collectionId?: number;
    } = { contentId: Number(id) };
    if (data.pendingLinkType === "video") {
      payload.videoId = Number(data.pendingLinkId);
    } else {
      payload.collectionId = Number(data.pendingLinkId);
    }
    await addContentLink(payload);
    // Refetch links
    const r = await fetch(`/api/admin/content/${id}`);
    const payloadBack = await r.json();
    setData((prev) => ({
      ...prev,
      links: payloadBack.links ?? prev.links,
      pendingLinkType: "",
      pendingLinkId: "",
    }));
    router.refresh();
  }

  const pageTitle = isNew
    ? "New Content"
    : data.title || "Edit Content";

  return (
    <div className="space-y-6 max-w-screen-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl">{pageTitle}</h1>
          {!isNew && (
            <span className={`text-xs tracking-widest uppercase px-2 py-0.5 border ${data.published ? "border-green-600 text-green-600" : "border-muted-foreground text-muted-foreground"}`}>
              {data.published ? "Published" : "Draft"}
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
                disabled={publishing || !loaded}
              >
                {publishing
                  ? data.published ? "Unpublishing…" : "Publishing…"
                  : data.published ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !loaded}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Type
          </label>
          <select
            value={data.type}
            onChange={(e) => {
              const nextType = e.target.value as ContentType;
              setData((prev) => ({
                ...prev,
                type: nextType,
                topic:
                  nextType === "review" || nextType === "event" || nextType === "news"
                    ? prev.topic
                    : "",
              }));
            }}
            className="h-9 w-full rounded border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="essay">Essay</option>
            <option value="blog">Blog</option>
            <option value="review">Review</option>
            <option value="news">News</option>
            <option value="event">Event</option>
          </select>
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Title
          </label>
          <Input
            value={data.title}
            onChange={(e) => {
              const v = e.target.value;
              setData((prev) => ({
                ...prev,
                title: v,
                slug: isNew ? slugify(v) : prev.slug,
              }));
            }}
            placeholder="Content title"
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

        {showsTopic && (
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
              {topicLabel}
            </label>
            <Input
              value={data.topic}
              onChange={(e) => set("topic", e.target.value)}
              placeholder={topicPlaceholder}
            />
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
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Tags
          </label>
          <Input
            value={data.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="comma, separated, tags"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
            Published Date
          </label>
          <Input
            type="date"
            value={data.publishedAt}
            onChange={(e) => set("publishedAt", e.target.value)}
            className="max-w-[12rem]"
          />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">
            Body
          </label>
          <TiptapEditor
            key={`content-${id}`}
            readingTheme
            content={data.bodyHtml}
            onChange={(html) => set("bodyHtml", html)}
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-heading text-xl">Linked Items</h2>

          {isNew ? (
            hasDeepLink ? (
              <p className="text-xs text-muted-foreground">
                Will link to {deepLinkType === "video" ? "video" : "collection"} #
                {deepLinkId} on save.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Save this content first to add links.
              </p>
            )
          ) : (
            <>
              {data.links.length === 0 ? (
                <p className="text-xs text-muted-foreground">No links yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.links.map((link) => {
                    const label = link.videoId
                      ? `Video · ${link.videoTitle ?? `#${link.videoId}`}`
                      : link.collectionId
                      ? `Collection · ${link.collectionTitle ?? `#${link.collectionId}`}`
                      : `Link #${link.id}`;
                    return (
                      <li
                        key={link.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <span className="text-sm">{label}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveLink(link.id)}
                        >
                          Remove
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="flex flex-wrap items-end gap-3 pt-2">
                <div className="flex-1 min-w-[10rem]">
                  <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
                    Link Type
                  </label>
                  <select
                    value={data.pendingLinkType}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        pendingLinkType: e.target.value as
                          | "video"
                          | "collection"
                          | "",
                        pendingLinkId: "",
                      }))
                    }
                    className="h-9 w-full rounded border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select type…</option>
                    <option value="video">Video</option>
                    <option value="collection">Collection</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[12rem]">
                  <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">
                    Target
                  </label>
                  <select
                    value={data.pendingLinkId === "" ? "" : String(data.pendingLinkId)}
                    onChange={(e) =>
                      set(
                        "pendingLinkId",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    disabled={!data.pendingLinkType}
                    className="h-9 w-full rounded border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Select target…</option>
                    {(data.pendingLinkType === "video"
                      ? data.videos
                      : data.pendingLinkType === "collection"
                      ? data.collections
                      : []
                    ).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddLink}
                  disabled={!data.pendingLinkType || data.pendingLinkId === ""}
                >
                  Add
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
