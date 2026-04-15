/**
 * Transcode local master video files for published `videos` rows (HandBrake VideoToolbox).
 *
 * Read-only against Neon. Scans ARCHIVE (default: /Volumes/Archive/VideoMasters) for video files;
 * matches each DB row by slug basename and/or fuzzy title/slug match.
 * Writes under ARCHIVE/Compressed and ARCHIVE/missing_video_encode.log.
 *
 * First run (one video):
 *   npm run compress:video-archive:one
 *
 * All published rows:
 *   npm run compress:video-archive
 *
 * Output: Compressed/{slug}.mp4 (slug from DB; filesystem-safe). CQ from HANDBRAKE_Q — for vt_h264,
 * higher -q = less compression / larger files (opposite of x264 RF; see constant below).
 *
 * Options:
 *   --limit N     Process at most N rows (after DB query order by id)
 *   --dry-run     Print actions only; no HandBrake, no log append
 *   --force       Re-encode even if output file already exists (replaces file)
 *   --archive PATH  Override archive root (default /Volumes/Archive/VideoMasters)
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { config } = await import("dotenv");
config({ path: path.resolve(__dirname, "../.env.local") });

const DEFAULT_ARCHIVE = "/Volumes/Archive/VideoMasters";
/**
 * HandBrake VideoToolbox H.264 constant quality (-q): scale is ~0–100 (higher = higher quality / less compression).
 * Unlike x264 RF, larger values mean gentler encodes and bigger files. ~35–50 = stronger compression / smaller files;
 * ~60–75 = much gentler; ~80+ = very close to visually lossless at 1080p cap (large files).
 */
const HANDBRAKE_Q = "50";

function parseArgs(argv) {
  let limit = Infinity;
  let dryRun = false;
  let force = false;
  let archiveRoot = DEFAULT_ARCHIVE;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    if (a === "--force") force = true;
    else if (a === "--limit" && argv[i + 1]) {
      limit = Math.max(1, parseInt(String(argv[++i]), 10) || 1);
    } else if (a === "--archive" && argv[i + 1]) {
      archiveRoot = path.resolve(String(argv[++i]));
    }
  }
  return { limit, dryRun, force, archiveRoot };
}

/** Safe basename for output .mp4 (uses DB slug; falls back to db id). */
function outputBasename(slug, rowId) {
  const raw = (slug && String(slug).trim()) || `video-${rowId}`;
  const safe = raw
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return (safe.length > 0 ? safe : `video-${rowId}`) + ".mp4";
}

function isMasterVideoFile(filePath) {
  const lower = filePath.toLowerCase();
  return MASTER_VIDEO_EXTS.some((ext) => lower.endsWith(ext));
}

function basenameNoExt(filePath) {
  return path.basename(filePath, path.extname(filePath)).toLowerCase();
}

/** Share of slug segments (split on '-') that appear in the filename stem. */
function slugTokenScore(filePath, slug) {
  const base = basenameNoExt(filePath);
  const tokens = String(slug || "")
    .toLowerCase()
    .split("-")
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return 0;
  let hit = 0;
  for (const t of tokens) {
    if (base.includes(t)) hit++;
  }
  return hit / tokens.length;
}

/** Share of significant title words that appear in the filename stem. */
function titleWordScore(filePath, title) {
  const base = basenameNoExt(filePath);
  const words = String(title || "")
    .toLowerCase()
    .split(/[\s–—-]+/)
    .map((w) => w.replace(/[^a-z0-9]/gi, ""))
    .filter((w) => w.length >= 3);
  if (words.length === 0) return 0;
  let hit = 0;
  for (const w of words) {
    if (base.includes(w)) hit++;
  }
  return hit / words.length;
}

/**
 * Find a master file: exact slug basename, or best title/slug fuzzy match.
 */
function findMasterForRow(masterFiles, row) {
  const slug = String(row.slug || "").trim().toLowerCase();
  const title = row.title;

  if (slug) {
    for (const f of masterFiles) {
      if (basenameNoExt(f) === slug) {
        return { path: f, reason: "basename=slug" };
      }
    }
  }

  let best = null;
  let bestCombined = 0;
  for (const f of masterFiles) {
    const sSlug = slug ? slugTokenScore(f, slug) : 0;
    const sTitle = title ? titleWordScore(f, title) : 0;
    const combined = sSlug * 0.45 + sTitle * 0.55;
    if (combined > bestCombined) {
      bestCombined = combined;
      best = f;
    }
  }
  if (best && bestCombined >= 0.42) {
    return {
      path: best,
      reason: `fuzzy slug+title (${(bestCombined * 100).toFixed(0)}%)`,
    };
  }

  return null;
}

/** Recursive file list; skips directory names in `skipDirs` (e.g. output Compressed). */
async function walkFiles(dir, skipDirs = new Set()) {
  const out = [];
  async function inner(d) {
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (skipDirs.has(e.name)) continue;
        await inner(full);
      } else out.push(full);
    }
  }
  await inner(dir);
  return out;
}

const MASTER_VIDEO_EXTS = [".mp4", ".mov", ".mkv", ".m4v", ".webm"];

async function listMasterVideoFiles(archiveRoot) {
  const allFiles = await walkFiles(archiveRoot, new Set(["Compressed"]));
  return allFiles.filter(isMasterVideoFile);
}

async function folderSizeBytes(dir) {
  let total = 0;
  async function inner(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await inner(full);
      else {
        const st = await fs.stat(full);
        total += st.size;
      }
    }
  }
  try {
    await inner(dir);
  } catch {
    return 0;
  }
  return total;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(2)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(2)} MB`;
  return `${(n / 1024 ** 3).toFixed(3)} GB`;
}

async function main() {
  const { limit, dryRun, force, archiveRoot } = parseArgs(process.argv.slice(2));
  const compressedDir = path.join(archiveRoot, "Compressed");
  const missingLog = path.join(archiveRoot, "missing_video_encode.log");

  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL or DATABASE_URL_UNPOOLED not set (.env.local)");
    process.exit(1);
  }

  try {
    await fs.access(archiveRoot);
  } catch {
    console.error(`ERROR: Archive not found: ${archiveRoot}`);
    process.exit(1);
  }

  await fs.mkdir(compressedDir, { recursive: true });

  console.log(`Archive root: ${archiveRoot}`);
  console.log(`HandBrake CQ=${HANDBRAKE_Q} (vt_h264: higher = less compression); force=${force}`);
  console.log(
    `Scanning master videos (${MASTER_VIDEO_EXTS.join(", ")}) — skipping Compressed/ …`
  );
  const masterFiles = await listMasterVideoFiles(archiveRoot);
  console.log(`Found ${masterFiles.length} master video file(s).`);

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);

  const rows = await sql`
    SELECT id, title, slug
    FROM videos
    WHERE published = true
    ORDER BY id ASC
  `;

  const toProcess = rows.slice(0, limit);
  console.log(
    `DB: ${rows.length} published row(s); processing ${toProcess.length} (limit=${limit === Infinity ? "none" : limit}).`
  );

  const appendLog = (line) => {
    if (dryRun) return;
    appendFileSync(missingLog, `${line}\n`, "utf8");
  };

  let skipped = 0;
  let encoded = 0;
  let failed = 0;

  for (const row of toProcess) {
    const outName = outputBasename(row.slug, row.id);
    const outPath = path.join(compressedDir, outName);

    const found = findMasterForRow(masterFiles, row);
    if (!found) {
      const msg = `MISSING_FILE\tdb_id=${row.id}\tslug=${row.slug}\ttitle=${row.title}`;
      console.log(msg);
      appendLog(msg);
      continue;
    }
    const inputPath = found.path;
    console.log(`Match (${found.reason}): ${inputPath}`);

    if (!force) {
      try {
        await fs.access(outPath);
        console.log(`SKIP (exists): ${outPath}`);
        skipped++;
        continue;
      } catch {
        /* encode */
      }
    } else {
      try {
        await fs.unlink(outPath);
        console.log(`--force: replaced existing ${outPath}`);
      } catch {
        /* no prior file */
      }
    }

    const hbArgs = [
      "-i",
      inputPath,
      "-o",
      outPath,
      "-e",
      "vt_h264",
      "-q",
      HANDBRAKE_Q,
      "--maxHeight",
      "1080",
      "--optimize",
    ];

    if (dryRun) {
      console.log(`DRY-RUN HandBrakeCLI ${hbArgs.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(" ")}`);
      continue;
    }

    console.log(`\nENCODE slug=${row.slug}\n  in:  ${inputPath}\n  out: ${outPath}`);
    const r = spawnSync("HandBrakeCLI", hbArgs, {
      stdio: "inherit",
      env: process.env,
    });
    if (r.status !== 0) {
      failed++;
      const msg = `FAILED_ENCODE\tdb_id=${row.id}\tslug=${row.slug}\tstatus=${r.status}`;
      console.error(msg);
      appendLog(msg);
      continue;
    }
    encoded++;
  }

  const totalBytes = await folderSizeBytes(compressedDir);
  console.log(`\nDone. Encoded: ${encoded}, skipped (already there): ${skipped}, failed: ${failed}`);
  console.log(`Compressed folder total size: ${formatBytes(totalBytes)} (${totalBytes} bytes)`);
  console.log(`Output directory: ${compressedDir}`);
  if (!dryRun) {
    console.log(`Missing / issues log: ${missingLog}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
