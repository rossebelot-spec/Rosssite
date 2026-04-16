"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/format-bytes";

type UploadState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "uploading"; progress: number }
  | { status: "done"; publicUrl: string; bytes: number }
  | { status: "error"; message: string };

export default function AdminVideoUploadPage() {
  const fileInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  function handlePick(f: File | undefined) {
    if (!f) return;
    setFile(f);
    // Pre-fill custom name with the file's stem + -compressed if present, keep .mp4
    const stem = f.name.replace(/\.[^.]+$/, "");
    setCustomName(stem + ".mp4");
    setState({ status: "idle" });
    setCopied(false);
  }

  function resolveKey(f: File, name: string) {
    const clean = name.trim() || f.name;
    // Always .mp4
    return clean.endsWith(".mp4") ? clean : clean.replace(/\.[^.]+$/, "") + ".mp4";
  }

  async function handleUpload() {
    if (!file) return;
    setState({ status: "requesting" });
    setCopied(false);

    const key = resolveKey(file, customName);
    const contentType = "video/mp4";

    // 1. Get presigned URL from our API
    let presignedUrl: string;
    let publicUrl: string;
    try {
      const res = await fetch("/api/admin/r2-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: key, contentType }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `Server error ${res.status}`);
      }
      const data = await res.json() as { presignedUrl: string; publicUrl: string };
      presignedUrl = data.presignedUrl;
      publicUrl = data.publicUrl;
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to get upload URL.",
      });
      return;
    }

    // 2. PUT directly to R2 with progress tracking
    setState({ status: "uploading", progress: 0 });

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setState({ status: "uploading", progress: Math.round((e.loaded / e.total) * 100) });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setState({ status: "done", publicUrl, bytes: file.size });
        } else {
          setState({ status: "error", message: `R2 upload failed (HTTP ${xhr.status})` });
        }
        resolve();
      });

      xhr.addEventListener("error", () => {
        setState({
          status: "error",
          message:
            "Network error during upload — most likely a CORS issue. " +
            "The R2 bucket needs a CORS rule allowing PUT from this origin. " +
            `Status: ${xhr.status || "0 (blocked before reaching R2)"}`,
        });
        resolve();
      });

      xhr.addEventListener("abort", () => {
        setState({ status: "error", message: "Upload cancelled." });
        resolve();
      });

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.send(file);
    });
  }

  function handleCancel() {
    xhrRef.current?.abort();
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const busy =
    state.status === "requesting" || state.status === "uploading";

  return (
    <div className="space-y-10 max-w-screen-sm">
      <div>
        <h1 className="font-heading text-3xl">Upload to R2</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Uploads the file directly from your browser to Cloudflare R2 — nothing
          passes through Vercel. Paste the resulting URL into a video or online
          reading record.
        </p>
      </div>

      {/* Setup checklist */}
      <details className="border border-border rounded-md text-sm">
        <summary className="px-4 py-3 cursor-pointer text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors select-none">
          Setup requirements
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-4 text-sm">
          <div>
            <p className="font-medium mb-1">1 — Env vars in <code>.env.local</code></p>
            <pre className="text-xs bg-muted rounded p-3 overflow-x-auto">{`R2_ACCESS_KEY_ID=your_key\nR2_SECRET_ACCESS_KEY=your_secret`}</pre>
          </div>
          <div>
            <p className="font-medium mb-1">2 — CORS rule on the R2 bucket</p>
            <p className="text-muted-foreground text-xs mb-2">
              In the Cloudflare dashboard: R2 → <strong>videos</strong> bucket → Settings → CORS Policy → Add rule.
              Paste this JSON:
            </p>
            <pre className="text-xs bg-muted rounded p-3 overflow-x-auto whitespace-pre">{`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]`}</pre>
            <p className="text-muted-foreground text-xs mt-2">
              If you prefer to restrict to your own domains, replace <code>*</code> with{" "}
              <code>http://localhost:3000</code> and your production URL.
            </p>
          </div>
        </div>
      </details>

      <section className="border border-border rounded-md p-6 space-y-5">
        <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
          File
        </h2>

        <div className="space-y-2">
          <label
            htmlFor={fileInputId}
            className="text-xs text-muted-foreground block"
          >
            Video file (MP4 recommended)
          </label>
          <input
            id={fileInputId}
            ref={inputRef}
            type="file"
            accept=".mp4,.mov,.mkv,.m4v,video/*"
            className="block text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-2 file:py-1 file:text-xs"
            onChange={(e) => handlePick(e.target.files?.[0])}
            disabled={busy}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              {file.name} — {formatBytes(file.size)}
            </p>
          )}
        </div>

        {file && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground block">
              Filename on R2 (editable)
            </label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="my-reading.mp4"
              disabled={busy}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This becomes the key in the bucket and the end of the public URL.
            </p>
          </div>
        )}

        <div className="flex gap-3 items-center flex-wrap">
          <Button
            onClick={handleUpload}
            disabled={!file || busy}
          >
            {state.status === "requesting"
              ? "Preparing…"
              : state.status === "uploading"
                ? "Uploading…"
                : "Upload to R2"}
          </Button>
          {state.status === "uploading" && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {state.status === "uploading" && (
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-warm-accent transition-all duration-200"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{state.progress}%</p>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <p className="text-sm text-destructive border border-destructive/30 rounded px-3 py-2">
            {state.message}
          </p>
        )}
      </section>

      {/* Success */}
      {state.status === "done" && (
        <section className="border border-green-600/40 rounded-md p-6 space-y-4 bg-green-50/30 dark:bg-green-950/20">
          <h2 className="text-xs tracking-widest uppercase text-green-700 dark:text-green-400">
            Upload complete — {formatBytes(state.bytes)}
          </h2>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Public URL</p>
            <p className="font-mono text-sm break-all">{state.publicUrl}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(state.publicUrl)}
            >
              {copied ? "Copied!" : "Copy URL"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFile(null);
                setCustomName("");
                setState({ status: "idle" });
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Upload another
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
