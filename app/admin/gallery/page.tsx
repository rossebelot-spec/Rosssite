"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  toggleGalleryPhotoActive,
  setGalleryPhotoFeatured,
  deleteGalleryPhoto,
  updateGalleryPhotoTitle,
  registerGalleryPhoto,
} from "@/lib/actions";
import type { GalleryPhoto } from "@/db/schema";

type Filter = "all" | "active" | "inactive";

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  // Register from URL state
  const [registerUrl, setRegisterUrl] = useState("");
  const [registerTitle, setRegisterTitle] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load gallery");
      setPhotos(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const visible = photos.filter((p) => {
    if (filter === "active") return p.isActive;
    if (filter === "inactive") return !p.isActive;
    return true;
  });

  const activeCount = photos.filter((p) => p.isActive).length;
  const featuredPhoto = photos.find((p) => p.isFeatured);

  async function handleToggleActive(photo: GalleryPhoto) {
    await toggleGalleryPhotoActive(photo.id, !photo.isActive);
    await loadPhotos();
  }

  async function handleSetFeatured(photo: GalleryPhoto) {
    await setGalleryPhotoFeatured(photo.id);
    await loadPhotos();
  }

  async function handleDelete(photo: GalleryPhoto) {
    if (!confirm(`Delete "${photo.title || photo.sourceId}"? This cannot be undone.`)) return;
    await deleteGalleryPhoto(photo.id);
    await loadPhotos();
  }

  async function handleSaveTitle(photo: GalleryPhoto) {
    await updateGalleryPhotoTitle(photo.id, editTitle);
    setEditingId(null);
    await loadPhotos();
  }

  async function handleRegisterUrl(e: React.FormEvent) {
    e.preventDefault();
    const url = registerUrl.trim();
    if (!url) return;
    setRegistering(true);
    setRegisterError(null);
    setRegisterSuccess(null);
    try {
      const row = await registerGalleryPhoto({
        r2Url: url,
        title: registerTitle.trim() || undefined,
      });
      setRegisterSuccess(`Registered: ${row.title || row.sourceId}`);
      setRegisterUrl("");
      setRegisterTitle("");
      await loadPhotos();
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl">Gallery</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {photos.length} total · {activeCount} active
            {featuredPhoto && (
              <> · Featured: <span className="text-warm-accent">{featuredPhoto.title || featuredPhoto.sourceId}</span></>
            )}
          </p>
        </div>
        <a
          href="/photography/collections/most-interesting"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-3 py-1.5"
        >
          View live ↗
        </a>
      </div>

      {loadError && (
        <p className="text-destructive text-sm border border-destructive/30 rounded px-3 py-2">
          {loadError}
        </p>
      )}

      {/* Register from R2 URL */}
      <details className="border border-border rounded-md">
        <summary className="px-4 py-3 text-xs tracking-widest uppercase text-muted-foreground cursor-pointer select-none hover:text-foreground">
          Register photo from R2 URL
        </summary>
        <form onSubmit={handleRegisterUrl} className="px-4 pb-4 pt-2 space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">R2 public URL</label>
            <Input
              value={registerUrl}
              onChange={(e) => setRegisterUrl(e.target.value)}
              placeholder="https://pub-….r2.dev/my-photo.webp"
              required
              disabled={registering}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">Title (optional)</label>
            <Input
              value={registerTitle}
              onChange={(e) => setRegisterTitle(e.target.value)}
              placeholder="Photo title"
              disabled={registering}
            />
          </div>
          {registerError && (
            <p className="text-xs text-destructive">{registerError}</p>
          )}
          {registerSuccess && (
            <p className="text-xs text-warm-accent">{registerSuccess}</p>
          )}
          <Button type="submit" size="sm" disabled={registering || !registerUrl.trim()}>
            {registering ? "Registering…" : "Register"}
          </Button>
        </form>
      </details>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        {(["all", "active", "inactive"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs tracking-widest uppercase px-3 py-1.5 rounded transition-colors ${
              filter === f
                ? "bg-warm-accent/20 text-warm-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((photo) => (
            <div
              key={photo.id}
              className={`group relative border rounded overflow-hidden bg-surface transition-opacity ${
                !photo.isActive ? "opacity-40" : ""
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={photo.r2Url}
                  alt={photo.title || photo.sourceId}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                  {photo.isFeatured && (
                    <span className="bg-warm-accent text-background text-xs px-1.5 py-0.5 rounded-sm font-mono">
                      Featured
                    </span>
                  )}
                  {!photo.isActive && (
                    <span className="bg-muted-foreground text-background text-xs px-1.5 py-0.5 rounded-sm font-mono">
                      Hidden
                    </span>
                  )}
                </div>
                {/* Score badge */}
                <span className="absolute bottom-2 right-2 bg-background/80 text-xs px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                  ★ {photo.interestingnessScore}
                </span>
              </div>

              {/* Title / edit */}
              <div className="px-2 pt-2 pb-1">
                {editingId === photo.id ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle(photo);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
                    />
                    <button
                      onClick={() => handleSaveTitle(photo)}
                      className="text-xs text-warm-accent hover:text-foreground"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(photo.id);
                      setEditTitle(photo.title);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground text-left w-full truncate"
                    title="Click to edit title"
                  >
                    {photo.title || <span className="italic opacity-50">No title</span>}
                  </button>
                )}
                <p className="text-xs text-muted-foreground/50 font-mono mt-0.5">
                  {photo.views}v · {photo.faves}♥
                </p>
              </div>

              {/* Actions */}
              <div className="px-2 pb-2 flex gap-1 flex-wrap">
                {!photo.isFeatured && photo.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => handleSetFeatured(photo)}
                  >
                    Feature
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={() => handleToggleActive(photo)}
                >
                  {photo.isActive ? "Hide" : "Show"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => handleDelete(photo)}
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <p className="text-muted-foreground text-sm">
          {filter === "all"
            ? "No photos yet. Use the bulk import script to load photos after processing."
            : `No ${filter} photos.`}
        </p>
      )}
    </div>
  );
}
