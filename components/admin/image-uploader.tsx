"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  onUpload: (blobUrl: string) => void;
  existingUrl?: string;
}

export function ImageUploader({ onUpload, existingUrl }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
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
              src={preview}
              alt="Upload preview"
              fill
              className="object-cover rounded"
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
        accept="image/*"
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
