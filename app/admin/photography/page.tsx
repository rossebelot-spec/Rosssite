"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPhoto,
  deletePhoto,
  setHeroPhoto,
  updatePhoto,
  addPhotoToCollection,
  removePhotoFromCollection,
  movePhotoInCollection,
  createPhotoCollectionWithFirstPhoto,
} from "@/lib/actions";
import { blobImageUrl } from "@/lib/blob";
import type { Photo } from "@/db/schema";

interface PhotoCollection {
  id: number;
  title: string;
  slug: string;
}

interface PhotoWithCollections extends Photo {
  collectionMemberships: { collectionId: number; position: number }[];
}

export default function AdminPhotographyPage() {
  const [photos, setPhotos] = useState<PhotoWithCollections[]>([]);
  const [photoCollections, setPhotoCollections] = useState<PhotoCollection[]>([]);
  const [blobUrl, setBlobUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Per-photo collection assignment UI state
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [assigning, setAssigning] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      const [photosRes, collectionsRes] = await Promise.all([
        fetch("/api/admin/photos"),
        fetch("/api/admin/photo-collections"),
      ]);
      const photosData = await photosRes.json();
      const collectionsData = await collectionsRes.json();
      if (!photosRes.ok) throw new Error(photosData.error ?? "Failed to load photos");
      if (!collectionsRes.ok) throw new Error(collectionsData.error ?? "Failed to load collections");

      // Fetch memberships separately
      const membershipsRes = await fetch("/api/admin/photo-memberships");
      const memberships: { photoId: number; collectionId: number; position: number }[] =
        membershipsRes.ok ? await membershipsRes.json() : [];

      const withCollections: PhotoWithCollections[] = photosData.map((p: Photo) => ({
        ...p,
        collectionMemberships: memberships.filter((m) => m.photoId === p.id),
      }));

      setPhotos(withCollections);
      setPhotoCollections(collectionsData);
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

  async function handleSetHero(photo: PhotoWithCollections) {
    await setHeroPhoto(photo.id);
    await loadPhotos();
  }

  async function handleDelete(photo: PhotoWithCollections) {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    await deletePhoto(photo.id, photo.blobUrl);
    await loadPhotos();
  }

  async function handleAssign(photo: PhotoWithCollections) {
    if (!selectedCollectionId) return;
    setAssigning(true);
    try {
      if (selectedCollectionId === "__new__") {
        const title = newCollectionTitle.trim();
        if (!title) return;
        const newColl = await createPhotoCollectionWithFirstPhoto(photo.id, title);
        setPhotoCollections((prev) => [...prev, newColl].sort((a, b) => a.title.localeCompare(b.title)));
        setNewCollectionTitle("");
      } else {
        await addPhotoToCollection(photo.id, parseInt(selectedCollectionId));
      }
      setAssigningId(null);
      setSelectedCollectionId("");
      await loadPhotos();
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveFromCollection(photoId: number, collectionId: number) {
    await removePhotoFromCollection(photoId, collectionId);
    await loadPhotos();
  }

  async function handleMove(photoId: number, collectionId: number, direction: "up" | "down") {
    await movePhotoInCollection(photoId, collectionId, direction);
    await loadPhotos();
  }

  function collectionName(id: number) {
    return photoCollections.find((c) => c.id === id)?.title ?? `Collection ${id}`;
  }

  // Filter out collections the photo is already in
  function availableCollections(photo: PhotoWithCollections) {
    const memberIds = new Set(photo.collectionMemberships.map((m) => m.collectionId));
    return photoCollections.filter((c) => !memberIds.has(c.id));
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl">Photo Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload photos for the front-page hero and curated collections on the{" "}
          <a href="/multimedia" className="text-warm-accent hover:underline">
            multimedia page
          </a>
          .
        </p>
      </div>

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
          {saving ? "Saving…" : "Add to library"}
        </Button>
      </section>

      {/* Library */}
      <section>
        <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
          Library ({photos.length} photos)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div key={photo.id} className="group space-y-2">
              {/* Thumbnail */}
              <div className="relative aspect-square overflow-hidden bg-surface rounded">
                <Image
                  src={blobImageUrl(photo.blobUrl)}
                  alt={photo.alt || photo.caption || ""}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
                {photo.isHero && (
                  <span className="absolute top-2 left-2 bg-warm-accent text-background text-xs px-2 py-0.5 rounded-sm font-mono">
                    Hero
                  </span>
                )}
              </div>

              {/* Caption */}
              {photo.caption && (
                <p className="text-xs text-muted-foreground truncate">{photo.caption}</p>
              )}

              {/* Collection memberships */}
              {photo.collectionMemberships.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {photo.collectionMemberships
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((m) => (
                      <span
                        key={m.collectionId}
                        className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded-full text-muted-foreground"
                      >
                        <button
                          onClick={() => handleMove(photo.id, m.collectionId, "up")}
                          className="hover:text-foreground"
                          title="Move earlier"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMove(photo.id, m.collectionId, "down")}
                          className="hover:text-foreground"
                          title="Move later"
                        >
                          ↓
                        </button>
                        <span>{collectionName(m.collectionId)}</span>
                        <button
                          onClick={() => handleRemoveFromCollection(photo.id, m.collectionId)}
                          className="hover:text-destructive ml-0.5"
                          title="Remove from collection"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}

              {/* Add to collection */}
              {assigningId === photo.id ? (
                <div className="space-y-2">
                  <select
                    value={selectedCollectionId}
                    onChange={(e) => {
                      setSelectedCollectionId(e.target.value);
                      setNewCollectionTitle("");
                    }}
                    className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground"
                  >
                    <option value="">— choose collection —</option>
                    {availableCollections(photo).map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.title}
                      </option>
                    ))}
                    <option value="__new__">+ New collection…</option>
                  </select>

                  {selectedCollectionId === "__new__" && (
                    <Input
                      autoFocus
                      placeholder="Collection title"
                      value={newCollectionTitle}
                      onChange={(e) => setNewCollectionTitle(e.target.value)}
                      className="text-xs h-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAssign(photo);
                        if (e.key === "Escape") {
                          setAssigningId(null);
                          setSelectedCollectionId("");
                        }
                      }}
                    />
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="text-xs h-7 flex-1"
                      onClick={() => handleAssign(photo)}
                      disabled={
                        assigning ||
                        !selectedCollectionId ||
                        (selectedCollectionId === "__new__" && !newCollectionTitle.trim())
                      }
                    >
                      {assigning ? "Saving…" : "Add"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => {
                        setAssigningId(null);
                        setSelectedCollectionId("");
                        setNewCollectionTitle("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 flex-1"
                    onClick={() => {
                      setAssigningId(photo.id);
                      setSelectedCollectionId("");
                    }}
                  >
                    + Collection
                  </Button>
                  {!photo.isHero && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 flex-1"
                      onClick={() => handleSetHero(photo)}
                    >
                      Set hero
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => handleDelete(photo)}
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
