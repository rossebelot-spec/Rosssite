"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { blobImageUrl } from "@/lib/blob";

const DEFAULT_MAX_DIM = 2048;
const DEFAULT_QUALITY = 0.85;

interface ImageUploaderProps {
  onUpload: (blobUrl: string) => void;
  existingUrl?: string;
  /** Passed to the file input, e.g. "image/jpeg" for JPEG-only. */
  accept?: string;
  /**
   * Compress the image to WebP before uploading (default: true).
   * Resizes to maxDim on the longest edge and encodes at quality 0–1.
   */
  compress?: boolean;
  maxDim?: number;
  quality?: number;
}

export function ImageUploader({
  onUpload,
  existingUrl,
  accept = "image/*",
  compress = true,
  maxDim = DEFAULT_MAX_DIM,
  quality = DEFAULT_QUALITY,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);

  useEffect(() => {
    setPreview(existingUrl ?? null);
  }, [existingUrl]);

  const [status, setStatus] = useState<"idle" | "compressing" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setError(null);

    let uploadFile: File = file;

    // Compress to WebP if enabled (skips format restriction — output is always WebP)
    if (compress) {
      setStatus("compressing");
      try {
        const objectUrl = URL.createObjectURL(file);
        const img = await loadImage(objectUrl);
        URL.revokeObjectURL(objectUrl);
        const { canvas } = resizeToCanvas(img, maxDim);
        const blob = await canvasToWebP(canvas, quality);
        const stem = file.name.replace(/\.[^.]+$/, "");
        uploadFile = new File([blob], `${stem}.webp`, { type: "image/webp" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Compression failed");
        setStatus("idle");
        return;
      }
    } else {
      // Original JPEG-only guard (only applies when compression is off)
      const jpegOnly =
        typeof accept === "string" &&
        (/image\/jpeg|\.jpe?g/i.test(accept) || accept === "image/jpeg");
      if (jpegOnly && file.type !== "image/jpeg") {
        setError("Please select a JPEG file (.jpg or .jpeg).");
        return;
      }
    }

    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", uploadFile);

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
      setStatus("idle");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const busy = status !== "idle";
  const statusLabel =
    status === "compressing" ? "Compressing…" :
    status === "uploading" ? "Uploading…" :
    "Click or drag to upload an image";

  return (
    <div className="space-y-3">
      <div
        className="border border-dashed border-border rounded-md p-8 text-center cursor-pointer hover:border-warm-accent transition-colors"
        onClick={() => !busy && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <div className="relative mx-auto w-48 aspect-square">
            <Image
              src={blobImageUrl(preview)}
              alt="Upload preview"
              fill
              sizes="192px"
              className="object-cover rounded"
              unoptimized
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{statusLabel}</p>
        )}
        {busy && (
          <p className="text-muted-foreground text-xs mt-2">{statusLabel}</p>
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
          // Reset so the same file can be re-selected
          e.target.value = "";
        }}
      />

      {preview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Replace image
        </Button>
      )}

      {compress && !busy && !error && (
        <p className="text-xs text-muted-foreground">
          Images are compressed to WebP (max {maxDim}px) before upload.
        </p>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function resizeToCanvas(
  img: HTMLImageElement,
  maxDim: number
): { canvas: HTMLCanvasElement; width: number; height: number } {
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      h = Math.round((h / w) * maxDim);
      w = maxDim;
    } else {
      w = Math.round((w / h) * maxDim);
      h = maxDim;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return { canvas, width: w, height: h };
}

function canvasToWebP(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null — browser may not support WebP export"));
      },
      "image/webp",
      quality
    );
  });
}
