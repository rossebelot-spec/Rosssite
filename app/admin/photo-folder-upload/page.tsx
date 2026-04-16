"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/format-bytes";
import { registerGalleryPhotoBatch } from "@/lib/actions";

const DEFAULT_MAX_DIM = 2048;
const DEFAULT_QUALITY = 0.85;

type FilePhase = "pending" | "compressing" | "done" | "error";
type UploadPhase = "idle" | "uploading" | "done" | "error";

interface CompressedFile {
  original: File;
  blob: Blob;
  width: number;
  height: number;
  filename: string; // e.g. "photo.webp"
  phase: FilePhase;
  error?: string;
}

interface UploadProgress {
  filename: string;
  progress: number; // 0–100
  phase: UploadPhase;
  publicUrl?: string;
  error?: string;
}

type Stage = "pick" | "compress" | "review" | "upload" | "done";

export default function AdminPhotoFolderUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [maxDim, setMaxDim] = useState(String(DEFAULT_MAX_DIM));
  const [quality, setQuality] = useState(String(Math.round(DEFAULT_QUALITY * 100)));

  // Stage machine
  const [stage, setStage] = useState<Stage>("pick");

  // Picked files
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState("");

  // After compression
  const [compressed, setCompressed] = useState<CompressedFile[]>([]);
  const [compressProgress, setCompressProgress] = useState(0); // count

  // R2 folder name (editable)
  const [r2Folder, setR2Folder] = useState("");

  // Upload tracking
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  // Registration
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function handleFolderPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!files.length) return;

    // Derive folder name from the webkitRelativePath
    const firstPath = files[0].webkitRelativePath;
    const folder = firstPath.split("/")[0] ?? "photos";
    setFolderName(folder);
    setR2Folder(`${folder}-compressed`);
    setSourceFiles(files);
    setCompressed([]);
    setCompressProgress(0);
    setUploads([]);
    setRegistered(false);
    setRegisterError(null);
    setStage("pick");
  }

  const handleCompress = useCallback(async () => {
    if (!sourceFiles.length) return;
    setStage("compress");
    setCompressProgress(0);

    const maxD = parseInt(maxDim) || DEFAULT_MAX_DIM;
    const q =
      Math.min(100, Math.max(1, parseInt(quality) || Math.round(DEFAULT_QUALITY * 100))) / 100;

    const results: CompressedFile[] = [];

    for (let i = 0; i < sourceFiles.length; i++) {
      const file = sourceFiles[i];
      const stem = file.name.replace(/\.[^.]+$/, "");
      const filename = `${stem}.webp`;

      try {
        const url = URL.createObjectURL(file);
        const img = await loadImage(url);
        URL.revokeObjectURL(url);
        const { canvas, width, height } = resizeToCanvas(img, maxD);
        const blob = await canvasToWebP(canvas, q);
        results.push({ original: file, blob, width, height, filename, phase: "done" });
      } catch (e) {
        results.push({
          original: file,
          blob: new Blob(),
          width: 0,
          height: 0,
          filename,
          phase: "error",
          error: e instanceof Error ? e.message : "Compression failed",
        });
      }

      setCompressProgress(i + 1);
    }

    setCompressed(results);
    setStage("review");
  }, [sourceFiles, maxDim, quality]);

  async function handleUpload() {
    const toUpload = compressed.filter((c) => c.phase === "done");
    if (!toUpload.length) return;

    const folder = r2Folder.trim().replace(/\/+$/, "");
    setStage("upload");
    setUploads(
      toUpload.map((c) => ({ filename: c.filename, progress: 0, phase: "idle" }))
    );

    const updatedUploads: UploadProgress[] = toUpload.map((c) => ({
      filename: c.filename,
      progress: 0,
      phase: "uploading" as UploadPhase,
    }));
    setUploads([...updatedUploads]);

    for (let i = 0; i < toUpload.length; i++) {
      const item = toUpload[i];
      const key = `${folder}/${item.filename}`;

      try {
        // Get presigned URL
        const presignRes = await fetch("/api/admin/r2-presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: key,
            contentType: "image/webp",
            bucket: "photos",
          }),
        });
        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error ?? `Presign failed (${presignRes.status})`);
        }
        const { presignedUrl, publicUrl } = await presignRes.json();

        // Upload via XHR for progress
        await uploadWithProgress(item.blob, presignedUrl, "image/webp", (pct) => {
          updatedUploads[i] = { ...updatedUploads[i], progress: pct };
          setUploads([...updatedUploads]);
        });

        updatedUploads[i] = {
          filename: item.filename,
          progress: 100,
          phase: "done",
          publicUrl,
        };
        setUploads([...updatedUploads]);
      } catch (e) {
        updatedUploads[i] = {
          filename: item.filename,
          progress: 0,
          phase: "error",
          error: e instanceof Error ? e.message : "Upload failed",
        };
        setUploads([...updatedUploads]);
      }
    }

    setStage("done");
  }

  async function handleRegister() {
    const succeeded = uploads.filter((u) => u.phase === "done" && u.publicUrl);
    if (!succeeded.length) return;
    setRegistering(true);
    setRegisterError(null);

    try {
      const photos = succeeded.map((u, i) => {
        const cf = compressed.find((c) => c.filename === u.filename);
        return {
          r2Url: u.publicUrl!,
          title: cf?.filename.replace(/\.webp$/, "") ?? "",
          sourceId: u.filename,
          width: cf?.width ?? null,
          height: cf?.height ?? null,
        };
      });
      await registerGalleryPhotoBatch(photos);
      setRegistered(true);
    } catch (e) {
      setRegisterError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalOriginalSize = sourceFiles.reduce((s, f) => s + f.size, 0);
  const totalCompressedSize = compressed
    .filter((c) => c.phase === "done")
    .reduce((s, c) => s + c.blob.size, 0);
  const successCount = compressed.filter((c) => c.phase === "done").length;
  const errorCount = compressed.filter((c) => c.phase === "error").length;
  const uploadDoneCount = uploads.filter((u) => u.phase === "done").length;
  const uploadErrorCount = uploads.filter((u) => u.phase === "error").length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10 max-w-screen-md">
      <div>
        <h1 className="font-heading text-3xl">Photo Folder Upload</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Pick a folder of photos, compress them to WebP in the browser, review the
          sizes, then upload directly to R2 and register them in the gallery.
        </p>
      </div>

      {/* ── Step 1: Pick folder ── */}
      <section className="border border-border rounded-md p-6 space-y-5">
        <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
          1 · Select folder
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is non-standard
          webkitdirectory=""
          multiple
          accept="image/*"
          className="block text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-2 file:py-1 file:text-xs"
          onChange={handleFolderPick}
        />

        {sourceFiles.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{folderName}</span>
            {" — "}
            {sourceFiles.length} image{sourceFiles.length !== 1 ? "s" : ""},{" "}
            {formatBytes(totalOriginalSize)} total
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
              disabled={stage === "compress" || stage === "upload"}
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
              disabled={stage === "compress" || stage === "upload"}
            />
          </div>
          <Button
            onClick={handleCompress}
            disabled={!sourceFiles.length || stage === "compress" || stage === "upload"}
          >
            {stage === "compress"
              ? `Compressing… (${compressProgress}/${sourceFiles.length})`
              : stage === "review" || stage === "done"
              ? "Recompress"
              : "Compress All"}
          </Button>
        </div>

        {/* Progress bar during compression */}
        {stage === "compress" && (
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-warm-accent h-2 transition-all"
              style={{ width: `${(compressProgress / sourceFiles.length) * 100}%` }}
            />
          </div>
        )}
      </section>

      {/* ── Step 2: Review ── */}
      {(stage === "review" || stage === "upload" || stage === "done") && (
        <section className="border border-border rounded-md p-6 space-y-5">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
            2 · Review &amp; approve upload
          </h2>

          {/* Summary */}
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Original total:</span>{" "}
              <span className="font-medium">{formatBytes(totalOriginalSize)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Compressed total:</span>{" "}
              <span className="font-medium text-warm-accent">
                {formatBytes(totalCompressedSize)}
              </span>
              {totalOriginalSize > 0 && (
                <span className="text-muted-foreground ml-2">
                  ({Math.round((1 - totalCompressedSize / totalOriginalSize) * 100)}% smaller)
                </span>
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Files:</span>{" "}
              {successCount} ready
              {errorCount > 0 && (
                <span className="text-destructive ml-2">· {errorCount} failed compression</span>
              )}
            </p>
          </div>

          {/* R2 folder name */}
          <div className="space-y-1 max-w-xs">
            <label className="text-xs text-muted-foreground block">
              R2 folder name (under photos bucket)
            </label>
            <Input
              value={r2Folder}
              onChange={(e) => setR2Folder(e.target.value)}
              disabled={stage === "upload" || stage === "done"}
              placeholder="my-photos-compressed"
            />
            <p className="text-xs text-muted-foreground">
              Files will upload as{" "}
              <code className="font-mono text-xs">
                {r2Folder || "folder"}/{"{filename}"}.webp
              </code>
            </p>
          </div>

          {/* Per-file table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="py-1.5 pr-4 font-normal">File</th>
                  <th className="py-1.5 pr-4 font-normal text-right">Original</th>
                  <th className="py-1.5 pr-4 font-normal text-right">Compressed</th>
                  <th className="py-1.5 pr-4 font-normal text-right">Reduction</th>
                  <th className="py-1.5 font-normal">Dimensions</th>
                </tr>
              </thead>
              <tbody>
                {compressed.map((c) => (
                  <tr key={c.filename} className="border-b border-border/50">
                    <td className="py-1.5 pr-4 font-mono truncate max-w-[180px]">
                      {c.phase === "error" ? (
                        <span className="text-destructive">{c.filename} ✕</span>
                      ) : (
                        c.filename
                      )}
                    </td>
                    <td className="py-1.5 pr-4 text-right text-muted-foreground">
                      {formatBytes(c.original.size)}
                    </td>
                    <td className="py-1.5 pr-4 text-right">
                      {c.phase === "done" ? formatBytes(c.blob.size) : "—"}
                    </td>
                    <td className="py-1.5 pr-4 text-right text-muted-foreground">
                      {c.phase === "done" && c.original.size > 0
                        ? `${Math.round((1 - c.blob.size / c.original.size) * 100)}%`
                        : "—"}
                    </td>
                    <td className="py-1.5 text-muted-foreground">
                      {c.phase === "done" ? `${c.width}×${c.height}` : c.error ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stage === "review" && (
            <Button
              onClick={handleUpload}
              disabled={successCount === 0 || !r2Folder.trim()}
              className="w-full sm:w-auto"
            >
              Upload {successCount} photo{successCount !== 1 ? "s" : ""} to R2 →
            </Button>
          )}
        </section>
      )}

      {/* ── Step 3: Upload progress ── */}
      {(stage === "upload" || stage === "done") && uploads.length > 0 && (
        <section className="border border-border rounded-md p-6 space-y-5">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
            3 · Upload progress
          </h2>

          <div className="space-y-2">
            {uploads.map((u) => (
              <div key={u.filename} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono truncate max-w-[240px]">{u.filename}</span>
                  <span className="text-muted-foreground ml-4 shrink-0">
                    {u.phase === "done"
                      ? "✓ uploaded"
                      : u.phase === "error"
                      ? <span className="text-destructive">✕ {u.error}</span>
                      : `${u.progress}%`}
                  </span>
                </div>
                {u.phase !== "done" && u.phase !== "error" && (
                  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-warm-accent h-1 transition-all"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {stage === "done" && (
            <p className="text-sm text-muted-foreground">
              {uploadDoneCount} uploaded
              {uploadErrorCount > 0 && (
                <span className="text-destructive ml-2">· {uploadErrorCount} failed</span>
              )}
            </p>
          )}
        </section>
      )}

      {/* ── Step 4: Register ── */}
      {stage === "done" && uploadDoneCount > 0 && (
        <section className="border border-border rounded-md p-6 space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
            4 · Register in gallery
          </h2>
          <p className="text-sm text-muted-foreground">
            Add the uploaded photos to the gallery database so they appear on the site.
          </p>

          {registered ? (
            <p className="text-sm text-warm-accent">
              ✓ {uploadDoneCount} photo{uploadDoneCount !== 1 ? "s" : ""} registered in gallery.{" "}
              <a href="/admin/gallery" className="underline">
                View gallery →
              </a>
            </p>
          ) : (
            <>
              {registerError && (
                <p className="text-sm text-destructive border border-destructive/30 rounded px-3 py-2">
                  {registerError}
                </p>
              )}
              <Button onClick={handleRegister} disabled={registering}>
                {registering
                  ? "Registering…"
                  : `Register ${uploadDoneCount} photo${uploadDoneCount !== 1 ? "s" : ""} in gallery`}
              </Button>
            </>
          )}
        </section>
      )}

      {/* CORS reminder */}
      <details className="text-xs text-muted-foreground border border-border rounded-md">
        <summary className="px-4 py-3 cursor-pointer select-none hover:text-foreground">
          Setup: R2 CORS requirement
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-2 leading-relaxed">
          <p>
            The <strong>photos</strong> R2 bucket must allow browser PUT requests. In the
            Cloudflare dashboard → R2 → photos bucket → Settings → CORS, add:
          </p>
          <pre className="bg-muted rounded p-3 overflow-x-auto text-xs font-mono whitespace-pre">
{`[{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["PUT"],
  "AllowedHeaders": ["Content-Type"]
}]`}
          </pre>
          <p>
            This is the same rule already added to the videos bucket. Without it, uploads
            will fail with "Network error (status 0)".
          </p>
        </div>
      </details>
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
        else
          reject(
            new Error(
              "Canvas toBlob returned null — browser may not support WebP export"
            )
          );
      },
      "image/webp",
      quality
    );
  });
}

function uploadWithProgress(
  blob: Blob,
  presignedUrl: string,
  contentType: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(
          new Error(
            `Upload failed (status ${xhr.status})${
              xhr.status === 0
                ? " — likely a CORS issue. Check the photos bucket CORS rule."
                : ""
            }`
          )
        );
      }
    };
    xhr.onerror = () =>
      reject(
        new Error(
          "Network error during upload — likely a CORS issue. Check the photos bucket CORS rule."
        )
      );
    xhr.send(blob);
  });
}
