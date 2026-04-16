"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { upsertSiteSetting, deleteUploadedBlobUrl } from "@/lib/actions";

const SLOTS = [
  {
    key: "works_hub_commentary_image",
    label: "Commentary and Analysis",
    href: "/op-eds",
  },
  {
    key: "works_hub_essays_image",
    label: "Essays",
    href: "/essays",
  },
  {
    key: "works_hub_literary_image",
    label: "Literary",
    href: "/literary",
  },
] as const;

type SlotKey = (typeof SLOTS)[number]["key"];

export default function AdminWorksHubPage() {
  const [images, setImages] = useState<Record<SlotKey, string>>({
    works_hub_commentary_image: "",
    works_hub_essays_image: "",
    works_hub_literary_image: "",
  });
  const [saving, setSaving] = useState<Record<SlotKey, boolean>>({
    works_hub_commentary_image: false,
    works_hub_essays_image: false,
    works_hub_literary_image: false,
  });
  // Track original URLs so we can clean up old blobs on replace
  const [originals, setOriginals] = useState<Record<SlotKey, string>>({
    works_hub_commentary_image: "",
    works_hub_essays_image: "",
    works_hub_literary_image: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings/works-hub")
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        const next = { ...images };
        const orig = { ...originals };
        for (const slot of SLOTS) {
          const val = data[slot.key] ?? "";
          next[slot.key] = val;
          orig[slot.key] = val;
        }
        setImages(next);
        setOriginals(orig);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(key: SlotKey) {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      // If the URL changed and we had an old blob, clean it up
      if (originals[key] && originals[key] !== images[key]) {
        await deleteUploadedBlobUrl(originals[key]);
      }
      await upsertSiteSetting(key, images[key] || null);
      setOriginals((prev) => ({ ...prev, [key]: images[key] }));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function handleRemove(key: SlotKey) {
    if (!originals[key]) return;
    if (!confirm("Remove this image?")) return;
    await deleteUploadedBlobUrl(originals[key]);
    await upsertSiteSetting(key, null);
    setImages((prev) => ({ ...prev, [key]: "" }));
    setOriginals((prev) => ({ ...prev, [key]: "" }));
  }

  return (
    <div className="space-y-8 max-w-screen-md">
      <div>
        <h1 className="font-heading text-3xl mb-2">Works Hub Images</h1>
        <p className="text-muted-foreground text-sm">
          Thumbnail images for the three category cards on the{" "}
          <a
            href="/work"
            target="_blank"
            className="text-warm-accent hover:underline"
          >
            /work
          </a>{" "}
          page. Recommended size: 576 × 384 px (3:2).
        </p>
      </div>

      <div className="space-y-10">
        {SLOTS.map((slot) => {
          const key = slot.key;
          const currentUrl = images[key];
          const isSaving = saving[key];
          return (
            <section
              key={key}
              className="border border-border rounded-md p-6 space-y-4"
            >
              <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
                {slot.label}
              </h2>

              {currentUrl ? (
                <div className="relative w-full max-w-xs h-40 rounded overflow-hidden border border-border">
                  <Image
                    src={currentUrl}
                    alt={slot.label}
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                </div>
              ) : (
                <div className="w-full max-w-xs h-40 rounded border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}

              <ImageUploader
                existingUrl={currentUrl || undefined}
                onUpload={(url) =>
                  setImages((prev) => ({ ...prev, [key]: url }))
                }
              />

              <div className="flex gap-3">
                <Button
                  size="sm"
                  onClick={() => handleSave(key)}
                  disabled={isSaving || !currentUrl}
                >
                  {isSaving ? "Saving…" : "Save"}
                </Button>
                {originals[key] && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(key)}
                    disabled={isSaving}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
