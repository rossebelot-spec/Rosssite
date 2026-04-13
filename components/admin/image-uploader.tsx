"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { blobImageUrl } from "@/lib/blob";

interface ImageUploaderProps {
  onUpload: (blobUrl: string) => void;
  existingUrl?: string;
  /** Passed to the file input, e.g. "image/jpeg" for JPEG-only. */
  accept?: string;
}

export function ImageUploader({
  onUpload,
  existingUrl,
  accept = "image/*",
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);

  useEffect(() => {
    setPreview(existingUrl ?? null);
  }, [existingUrl]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const jpegOnly =
      typeof accept === "string" &&
      (/image\/jpeg|\.jpe?g/i.test(accept) || accept === "image/jpeg");
    if (jpegOnly && file.type !== "image/jpeg") {
      setError("Please select a JPEG file (.jpg or .jpeg).");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? "Upload failed");
      }

      const { url } = await res.json();
      setPreview(url);
      onUpload(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-3">
      <div
        className="border border-dashed border-border rounded-md p-8 text-center cursor-pointer hover:border-warm-accent transition-colors"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <div className="relative mx-auto w-48 aspect-square">
            <Image
              src={blobImageUrl(preview)}
              alt="Upload preview"
              fill
              className="object-cover rounded"
              unoptimized
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {uploading ? "Uploading…" : "Click or drag to upload an image"}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Replace image
        </Button>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
