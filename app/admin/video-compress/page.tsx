"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/format-bytes";

export default function AdminVideoCompressPage() {
  const fileInputId = useId();
  const [transcodeAvailable, setTranscodeAvailable] = useState<boolean | null>(
    null
  );
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState("50");
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/video-transcode")
      .then((r) => r.json())
      .then((d: { transcodeAvailable?: boolean }) =>
        setTranscodeAvailable(d.transcodeAvailable === true)
      )
      .catch(() => setTranscodeAvailable(false));
  }, []);

  const revoke = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => {
      revoke(sourceUrl);
      revoke(compressedUrl);
    };
  }, [sourceUrl, compressedUrl, revoke]);

  function handlePickFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setCompressedSize(null);
    revoke(compressedUrl);
    setCompressedUrl(null);
    revoke(sourceUrl);
    const next = URL.createObjectURL(file);
    setSourceFile(file);
    setSourceUrl(next);
  }

  async function handleCompress() {
    if (!sourceFile || !sourceUrl) return;
    setError(null);
    setCompressing(true);
    revoke(compressedUrl);
    setCompressedUrl(null);
    setCompressedSize(null);

    const q = quality.trim();
    const form = new FormData();
    form.append("file", sourceFile);
    form.append("quality", q);

    try {
      const res = await fetch("/api/admin/video-transcode", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          /* use msg */
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
      setCompressedSize(blob.size);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compression failed.");
    } finally {
      setCompressing(false);
    }
  }

  const sourceSize = sourceFile?.size ?? null;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl">Video compression</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
          Pick a local master file, preview it, then transcode with HandBrake
          (VideoToolbox H.264, max height 1080). Adjust the quality value and
          compare the output until it looks acceptable. Same CQ scale as{" "}
          <code className="text-foreground">compress:video-archive</code>: for{" "}
          <code className="text-foreground">vt_h264</code>, higher values mean
          gentler compression (larger files).
        </p>
      </div>

      {transcodeAvailable === false && (
        <p className="text-sm border border-border rounded-md px-3 py-2 bg-surface text-muted-foreground">
          Transcoding is disabled on this deployment (Vercel). Run{" "}
          <code className="text-foreground">npm run dev</code> on your Mac with
          HandBrake CLI on <code className="text-foreground">PATH</code>, or use
          the repo CLI scripts for batch work.
        </p>
      )}

      <section className="border border-border rounded-md p-6 bg-surface space-y-4">
        <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
          Source file
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label
              htmlFor={fileInputId}
              className="text-xs text-muted-foreground block"
            >
              Video file
            </label>
            <input
              id={fileInputId}
              type="file"
              accept=".mp4,.mov,.mkv,.m4v,.webm,video/*"
              className="block text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-2 file:py-1 file:text-xs"
              onChange={(e) => handlePickFile(e.target.files?.[0])}
            />
          </div>
          {sourceFile && (
            <p className="text-sm">
              <span className="text-muted-foreground">Original size:</span>{" "}
              {formatBytes(sourceSize ?? 0)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 w-32">
            <label
              htmlFor="cq"
              className="text-xs text-muted-foreground block"
            >
              Quality (CQ)
            </label>
            <Input
              id="cq"
              type="number"
              min={0}
              max={100}
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={!sourceFile || compressing || transcodeAvailable === false}
            />
          </div>
          <Button
            type="button"
            onClick={handleCompress}
            disabled={
              !sourceFile ||
              compressing ||
              transcodeAvailable === false ||
              transcodeAvailable === null
            }
          >
            {compressing ? "Compressing…" : "Compress"}
          </Button>
        </div>

        {error && (
          <p className="text-destructive text-sm border border-destructive/30 rounded px-3 py-2 whitespace-pre-wrap">
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
          Preview
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Original</p>
            <div className="aspect-video bg-black rounded-md overflow-hidden">
              {sourceUrl ? (
                <video
                  src={sourceUrl}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm p-4">
                  Choose a file to preview
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">After compression</p>
            {compressedUrl && compressedSize !== null ? (
              <>
                <p className="text-sm">
                  <span className="text-muted-foreground">Compressed size:</span>{" "}
                  {formatBytes(compressedSize)}
                </p>
                <div className="aspect-video bg-black rounded-md overflow-hidden">
                  <video
                    src={compressedUrl}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                </div>
                <a
                  className="text-sm text-primary underline-offset-4 hover:underline inline-block"
                  href={compressedUrl}
                  download={`${sourceFile?.name.replace(/\.[^.]+$/, "") ?? "video"}-compressed.mp4`}
                >
                  Download compressed MP4
                </a>
              </>
            ) : (
              <div className="aspect-video bg-muted/30 rounded-md flex items-center justify-center text-muted-foreground text-sm p-4 border border-dashed border-border">
                {compressing
                  ? "Encoding… (this can take several minutes)"
                  : "Run Compress to see output here"}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
