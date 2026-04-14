import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";

/**
 * HandBrake transcoding for local admin only (HandBrakeCLI + VideoToolbox).
 * Disabled on Vercel — large uploads and long jobs do not belong on serverless.
 */

const VIDEO_EXT = /\.(mp4|mov|mkv|m4v|webm)$/i;

/** Client may call to show whether Compress is available (false on Vercel deploys). */
export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  return NextResponse.json({
    transcodeAvailable: process.env.VERCEL !== "1",
  });
}

function parseQuality(formData: FormData): number {
  const raw = formData.get("quality");
  if (typeof raw !== "string" || !/^\d{1,3}$/.test(raw)) return 50;
  const q = parseInt(raw, 10);
  return Math.min(100, Math.max(0, q));
}

export async function POST(req: NextRequest) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "Video transcoding is disabled on Vercel. Run the site locally with `npm run dev`, install HandBrake CLI, then use this tool — or use `npm run compress:vimeo-archive` / `scripts/migrate-videos-to-r2.mjs` on your machine.",
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid or missing multipart body." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Expected a non-empty \"file\" field." },
      { status: 400 }
    );
  }

  const name = file.name || "source.mp4";
  if (!VIDEO_EXT.test(name)) {
    return NextResponse.json(
      {
        error: "Unsupported type. Use .mp4, .mov, .mkv, .m4v, or .webm.",
      },
      { status: 400 }
    );
  }

  const quality = parseQuality(formData);
  const ext = path.extname(name) || ".mp4";
  let workDir: string | null = null;

  try {
    workDir = await mkdtemp(path.join(tmpdir(), "video-transcode-"));
    const inputPath = path.join(workDir, `input${ext}`);
    const outputPath = path.join(workDir, "output.mp4");

    await pipeline(
      Readable.fromWeb(file.stream() as import("stream/web").ReadableStream),
      createWriteStream(inputPath)
    );

    const hbArgs = [
      "-i",
      inputPath,
      "-o",
      outputPath,
      "-e",
      "vt_h264",
      "-q",
      String(quality),
      "--maxHeight",
      "1080",
      "--optimize",
    ];

    const { code, stderr } = await runHandBrake(hbArgs);
    if (code !== 0) {
      const tail = stderr.slice(-4000);
      console.error("HandBrakeCLI failed:", tail);
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
      return NextResponse.json(
        {
          error: `HandBrakeCLI failed (exit ${code}). Is HandBrake CLI installed and on PATH? ${tail}`,
        },
        { status: 500 }
      );
    }

    const st = await stat(outputPath);
    const nodeStream = createReadStream(outputPath);

    nodeStream.once("close", () => {
      void rm(workDir!, { recursive: true, force: true }).catch(() => {});
    });

    /** Node `Readable.toWeb` stream types do not unify with `BodyInit` in TS. */
    return new NextResponse(Readable.toWeb(nodeStream) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(st.size),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
    console.error(e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Transcode failed with an unknown error.",
      },
      { status: 500 }
    );
  }
}

function runHandBrake(args: string[]): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const p = spawn("HandBrakeCLI", args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    p.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    p.on("error", (err) => {
      resolve({ code: -1, stderr: stderr + String(err) });
    });
    p.on("close", (code) => {
      resolve({ code: code ?? -1, stderr });
    });
  });
}
