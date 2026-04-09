"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPhoto, deletePhoto, setHeroPhoto, updatePhoto } from "@/lib/actions";
import { blobImageUrl } from "@/lib/blob";
import type { Photo } from "@/db/schema";

export default function AdminPhotographyPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [blobUrl, setBlobUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/photos");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load photos");
      setPhotos(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load photos");
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  async function handleAdd() {
    if (!blobUrl) return;
    setSaving(true);
    try {
      await createPhoto({ blobUrl, caption, alt });
      setBlobUrl("");
      setCaption("");
      setAlt("");
      await loadPhotos();
    } finally {
      setSaving(false);
    }
  }

  async function handleSetHero(photo: Photo) {
    await setHeroPhoto(photo.id);
    await loadPhotos();
  }

  async function handleDelete(photo: Photo) {
    if (!confirm("Delete this photo?")) return;
    await deletePhoto(photo.id, photo.blobUrl);
    await loadPhotos();
  }

  return (
    <div className="space-y-10">
      <h1 className="font-heading text-3xl">Photography</h1>

      {loadError && (
        <p className="text-destructive text-sm border border-destructive/30 rounded px-3 py-2">
          {loadError}
        </p>
      )}

      {/* Add new photo */}
      <section className="border border-border rounded-md p-6 bg-surface space-y-4">
        <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
          Add Photo
        </h2>
        <ImageUploader onUpload={(url) => setBlobUrl(url)} />
        <Input
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <Input
          placeholder="Alt text (for accessibility)"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
        />
        <Button onClick={handleAdd} disabled={!blobUrl || saving} size="sm">
          {saving ? "Saving…" : "Add to gallery"}
        </Button>
      </section>

      {/* Gallery management */}
      <section>
        <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
          Gallery ({photos.length} photos)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative">
              <div className="relative aspect-square overflow-hidden bg-surface">
                <Image
                  src={blobImageUrl(photo.blobUrl)}
                  alt={photo.alt || photo.caption || ""}
                  fill
                  className="object-cover"
                />
                {photo.isHero && (
                  <span className="absolute top-2 left-2 bg-warm-accent text-background text-xs px-2 py-0.5 rounded-sm font-mono">
                    Hero
                  </span>
                )}
              </div>
              {photo.caption && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {photo.caption}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                {!photo.isHero && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleSetHero(photo)}
                  >
                    Set as hero
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className={photo.isHero ? "w-full text-xs" : "flex-1 text-xs"}
                  onClick={() => handleDelete(photo)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
