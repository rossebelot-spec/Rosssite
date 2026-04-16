"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/format-bytes";

const DEFAULT_MAX_DIM = 2048;
const DEFAULT_QUALITY = 0.85;

interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
  url: string;
}

export default function AdminPhotoCompressPage() {
  const fileInputId = useId();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [maxDim, setMaxDim] = useState(String(DEFAULT_MAX_DIM));
  const [quality, setQuality] = useState(String(Math.round(DEFAULT_QUALITY * 100)));
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevResultUrl = useRef<string | null>(null);

  function handlePick(file: File | undefined) {
    if (!file) return;
    setSourceFile(file);
    setResult(null);
    setError(null);
    if (prevResultUrl.current) URL.revokeObjectURL(prevResultUrl.current);
    const url = URL.createObjectURL(file);
    setSourcePreview(url);
  }

  async function handleCompress() {
    if (!sourceFile || !sourcePreview) return;
    setCompressing(true);
    setError(null);
    if (prevResultUrl.current) URL.revokeObjectURL(prevResultUrl.current);
    setResult(null);

    try {
      const img = await loadImage(sourcePreview);
      const maxD = parseInt(maxDim) || DEFAULT_MAX_DIM;
      const q = Math.min(100, Math.max(1, parseInt(quality) || Math.round(DEFAULT_QUALITY * 100))) / 100;

      const { canvas, width, height } = resizeToCanvas(img, maxD);
      const blob = await canvasToWebP(canvas, q);
      const url = URL.createObjectURL(blob);
      prevResultUrl.current = url;
      setResult({ blob, width, height, url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compression failed.");
    } finally {
      setCompressing(false);
    }
  }

  const stem = sourceFile?.name.replace(/\.[^.]+$/, "") ?? "photo";

  return (
    <div className="space-y-10 max-w-screen-md">
      <div>
        <h1 className="font-heading text-3xl">Photo Compress</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Resize and convert a photo to WebP in the browser. Download the result,
          then upload it to R2 using the{" "}
          <a href="/admin/video-upload" className="text-warm-accent hover:underline">
            Upload to R2
          </a>{" "}
          tool.
        </p>
      </div>

      <section className="border border-border rounded-md p-6 space-y-5">
        <h2 className="text-xs tracking-widest uppercase text-muted-foreground">Source</h2>

        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          className="block text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-2 file:py-1 file:text-xs"
          onChange={(e) => handlePick(e.target.files?.[0])}
        />

        {sourceFile && (
          <p className="text-sm text-muted-foreground">
            {sourceFile.name} — {formatBytes(sourceFile.size)}
          </p>
        )}

        <div className="flex flex-wrap gap-6 items-end">
          <div className="space-y-1 w-36">
            <label className="text-xs text-muted-foreground block">
              Max dimension (px)
            </label>
            <Input
              type="number"
              min={256}
              max={8000}
              value={maxDim}
              onChange={(e) => setMaxDim(e.target.value)}
              disabled={!sourceFile || compressing}
            />
          </div>
          <div className="space-y-1 w-28">
            <label className="text-xs text-muted-foreground block">
              Quality (1–100)
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={!sourceFile || compressing}
            />
          </div>
          <Button
            onClick={handleCompress}
            disabled={!sourceFile || compressing}
          >
            {compressing ? "Compressing…" : result ? "Recompress" : "Compress"}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive border border-destructive/30 rounded px-3 py-2">
            {error}
          </p>
        )}
      </section>

      {(sourcePreview || result) && (
        <section>
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
            Preview
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Original{sourceFile ? ` — ${formatBytes(sourceFile.size)}` : ""}
              </p>
              <div className="aspect-video bg-black rounded-md overflow-hidden">
                {sourcePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sourcePreview}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Compressed
                {result
                  ? ` — ${formatBytes(result.blob.size)} · ${result.width}×${result.height}`
                  : ""}
              </p>
              <div className="aspect-video bg-black rounded-md overflow-hidden">
                {result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.url}
                    alt="Compressed"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-md">
                    {compressing ? "Processing…" : "Run Compress to see output"}
                  </div>
                )}
              </div>
              {result && (
                <a
                  href={result.url}
                  download={`${stem}.webp`}
                  className="text-sm text-primary underline-offset-4 hover:underline inline-block"
                >
                  Download {stem}.webp
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Canvas helpers ──────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
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
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
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
