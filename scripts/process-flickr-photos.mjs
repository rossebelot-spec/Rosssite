/**
 * Process top 500 Flickr photos by interestingness score, upload to R2,
 * and bulk-insert into gallery_photos table.
 *
 * Photos are stored in R2 under a collection subfolder:
 *   photos/{collection-slug}/photo-{id}.webp
 * e.g. photos/most-interesting/photo-52341234.webp
 *
 * Usage:
 *   Plan only (inspect JSON, show top 500, no uploads):
 *     node scripts/process-flickr-photos.mjs --dir /path/to/extracted
 *
 *   Execute (prompts for R2 credentials):
 *     node scripts/process-flickr-photos.mjs --dir /path/to/extracted --execute
 *
 *   Override collection slug (default: most-interesting):
 *     node scripts/process-flickr-photos.mjs --dir /path/to/extracted --collection landscapes --execute
 *
 *   Override top-N count (default 500):
 *     node scripts/process-flickr-photos.mjs --dir /path/to/extracted --top 200 --execute
 *
 * The --dir should be the folder containing the extracted zip contents
 * (the one with photo_*.json files and image files).
 * If your zips are still packed, run first:
 *   cd "/Volumes/Archive/Flickr Archive" && mkdir extracted
 *   for f in *.zip; do unzip -q "$f" -d extracted; done
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream, statSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env.local") });

// ─── R2 config ───────────────────────────────────────────────────────────────
const R2_ACCOUNT_ID  = "87e1212f0dca896abd2b40062520b511";
const R2_ENDPOINT    = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_BUCKET      = "photos";
const R2_PUBLIC_BASE = "https://pub-efa70c06434341bc8c70873dce8e61ae.r2.dev";

// ─── Parse args ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  let dir        = null;
  let execute    = false;
  let measure    = false;
  let top        = 500;
  let collection = "most-interesting"; // R2 subfolder + DB collection slug
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir")        dir        = argv[++i];
    if (argv[i] === "--execute")    execute    = true;
    if (argv[i] === "--measure")    measure    = true;
    if (argv[i] === "--top")        top        = parseInt(argv[++i], 10);
    if (argv[i] === "--collection") collection = argv[++i];
  }
  return { dir, execute, measure, top, collection };
}

function fmtBytes(bytes) {
  if (bytes >= 1_073_741_824) return (bytes / 1_073_741_824).toFixed(2) + " GB";
  if (bytes >= 1_048_576)     return (bytes / 1_048_576).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
}

// ─── Find all photo JSON files recursively ───────────────────────────────────
async function findPhotoJsons(dir) {
  const results = [];
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile() && /^photo_\d+\.json$/i.test(e.name)) {
        results.push(full);
      }
    }
  }
  await walk(dir);
  return results;
}

// ─── Build a photoId → filepath index from the extracted directory ────────────
// Flickr export filenames: {id}_{hash}_o.jpg  OR  {title-slug}_{id}_{hash}_o.jpg
// We match any image file whose name CONTAINS the photo ID as a word-boundary segment.
async function buildImageIndex(dir) {
  const index = new Map(); // photoId (string) → best filepath
  const priority = ["_o.", "_b.", "_c.", "_z.", "_m."];

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) continue;

    // Extract numeric segments — the photo ID is the long numeric part
    const numericParts = e.name.match(/\d{6,}/g);
    if (!numericParts) continue;

    for (const id of numericParts) {
      const full = path.join(dir, e.name);
      const existing = index.get(id);
      if (!existing) {
        index.set(id, full);
      } else {
        // Prefer higher-quality size suffix
        const existingPri = priority.findIndex((s) => existing.includes(s));
        const newPri      = priority.findIndex((s) => full.includes(s));
        const ep = existingPri === -1 ? 99 : existingPri;
        const np = newPri      === -1 ? 99 : newPri;
        if (np < ep) index.set(id, full);
      }
    }
  }
  return index;
}

// ─── Compute interestingness score ───────────────────────────────────────────
// Faves weighted more heavily than views since they signal intentional appreciation
function interestingness(meta) {
  const views    = parseInt(meta.count_views    ?? "0", 10) || 0;
  const faves    = parseInt(meta.count_faves    ?? "0", 10) || 0;
  const comments = parseInt(meta.count_comments ?? "0", 10) || 0;
  return views + (faves * 10) + (comments * 5);
}

// ─── Parse date_taken ────────────────────────────────────────────────────────
function parseDateTaken(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function main() {
  const { dir, execute, measure, top, collection } = parseArgs(process.argv.slice(2));

  if (!dir) {
    console.error("Usage: node scripts/process-flickr-photos.mjs --dir /path/to/extracted [--collection most-interesting] [--measure] [--execute] [--top 500]");
    console.error("\nTip: extract all zips first:");
    console.error('  cd "/Volumes/Archive/Flickr Archive" && mkdir -p extracted');
    console.error('  for f in *.zip; do unzip -q "$f" -d extracted; done');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set (check .env.local).");
    process.exit(1);
  }

  console.log(`\nScanning for photo JSON files in: ${dir}`);
  const jsonFiles = await findPhotoJsons(dir);
  console.log(`Found ${jsonFiles.length} photo JSON files.`);
  console.log(`Building image file index…`);
  const imageIndex = await buildImageIndex(dir);
  console.log(`Indexed ${imageIndex.size} image files.\n`);

  if (jsonFiles.length === 0) {
    console.error("No photo_*.json files found. Make sure you extracted the zip files into --dir.");
    process.exit(1);
  }

  // Parse all metadata
  const allMeta = [];
  for (const jf of jsonFiles) {
    try {
      const raw = JSON.parse(await fs.readFile(jf, "utf8"));
      raw._jsonPath = jf;
      raw._jsonDir  = path.dirname(jf);
      allMeta.push(raw);
    } catch {
      // skip malformed JSON
    }
  }

  console.log(`Parsed ${allMeta.length} photos. Computing scores…`);

  // Score and sort
  const scored = allMeta
    .map((m) => ({ meta: m, score: interestingness(m) }))
    .sort((a, b) => b.score - a.score);

  const topPhotos = scored.slice(0, top);

  console.log(`\n=== Top ${top} by interestingness (views + faves×10 + comments×5) ===\n`);
  console.log(
    ["rank".padEnd(5), "score".padEnd(8), "views".padEnd(8), "faves".padEnd(7), "cmts".padEnd(6), "id".padEnd(20), "title"].join("")
  );
  console.log("-".repeat(100));

  for (let i = 0; i < Math.min(topPhotos.length, 30); i++) {
    const { meta, score } = topPhotos[i];
    console.log(
      [
        String(i + 1).padEnd(5),
        String(score).padEnd(8),
        String(meta.count_views ?? 0).padEnd(8),
        String(meta.count_faves ?? 0).padEnd(7),
        String(meta.count_comments ?? 0).padEnd(6),
        String(meta.id ?? "?").padEnd(20),
        (meta.name ?? meta.title ?? "").slice(0, 50),
      ].join("")
    );
  }
  if (topPhotos.length > 30) {
    console.log(`  … and ${topPhotos.length - 30} more`);
  }

  // Check image files exist
  console.log(`\nChecking image files for top ${top}…`);
  let missing = 0;
  for (const { meta } of topPhotos) {
    const imgPath = imageIndex.get(String(meta.id));
    if (!imgPath) missing++;
  }
  console.log(`Image files found: ${topPhotos.length - missing}/${topPhotos.length}`);
  if (missing > 0) {
    console.log(`  ⚠ ${missing} photos have no image file — they will be skipped.`);
  }

  if (!execute && !measure) {
    console.log("\n--- Plan only. Review the list above. ---");
    console.log(`  Measure exact WebP output sizes (no upload):`);
    console.log(`    node scripts/process-flickr-photos.mjs --dir "${dir}" --measure`);
    console.log(`  When ready to upload:`);
    console.log(`    node scripts/process-flickr-photos.mjs --dir "${dir}" --execute\n`);
    process.exit(0);
  }

  // ─── Measure mode: run Sharp on all photos, report sizes, no upload ────────
  if (measure) {
    let sharpMeasure;
    try {
      sharpMeasure = (await import("sharp")).default;
    } catch {
      console.error("Could not import sharp. Run: npm install (from ROSSSITE folder)");
      process.exit(1);
    }

    console.log(`\n=== Measuring WebP output sizes for top ${top} (no upload) ===\n`);
    let totalBytes  = 0;
    let processed   = 0;
    let skipped     = 0;

    for (let i = 0; i < topPhotos.length; i++) {
      const { meta } = topPhotos[i];
      const photoId  = String(meta.id);
      const imgPath  = imageIndex.get(photoId);
      if (!imgPath) { skipped++; continue; }

      try {
        const img = sharpMeasure(imgPath).rotate();
        const md  = await img.metadata();
        const pipeline = md.width && md.width > 1920
          ? img.resize({ width: 1920, withoutEnlargement: true })
          : img;
        const buf = await pipeline.webp({ quality: 85, effort: 4 }).toBuffer();
        totalBytes += buf.length;
        processed++;
        if (processed % 50 === 0) {
          process.stdout.write(`  ${processed}/${top} processed — running total: ${fmtBytes(totalBytes)}\n`);
        }
      } catch {
        skipped++;
      }
    }

    console.log(`\n=== Size report ===`);
    console.log(`  Photos processed : ${processed}`);
    console.log(`  Photos skipped   : ${skipped}`);
    console.log(`  Total WebP size  : ${fmtBytes(totalBytes)}`);
    console.log(`  Average per photo: ${fmtBytes(totalBytes / (processed || 1))}`);
    console.log(`\n  If total is too large, re-run with --top 300 or --top 200`);
    console.log(`  to trim the set before uploading.\n`);
    process.exit(0);
  }

  // ─── Execute ───────────────────────────────────────────────────────────────
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Could not import sharp. Run: npm install (from ROSSSITE folder)");
    process.exit(1);
  }

  let S3Client, PutObjectCommand;
  try {
    const mod = await import("@aws-sdk/client-s3");
    S3Client = mod.S3Client;
    PutObjectCommand = mod.PutObjectCommand;
  } catch {
    console.error("Could not import @aws-sdk/client-s3. Run: npm install @aws-sdk/client-s3@3");
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });
  const accessKeyId     = (await rl.question("R2 Access Key ID: ")).trim();
  const secretAccessKey = (await rl.question("R2 Secret Access Key: ")).trim();
  await rl.close();

  if (!accessKeyId || !secretAccessKey) {
    console.error("Credentials required.");
    process.exit(1);
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId, secretAccessKey },
  });

  const sql = neon(databaseUrl);

  // Seed the "Most Interesting" collection row if it doesn't exist
  const [existing] = await sql`SELECT id FROM collections WHERE slug = 'most-interesting' LIMIT 1`;
  if (!existing) {
    await sql`
      INSERT INTO collections (title, slug, media_type, description, published, published_at, display_order, created_at, updated_at)
      VALUES (
        'Most Interesting',
        'most-interesting',
        'photo',
        'Top photographs ranked by Flickr interestingness — views, faves, and comments.',
        true,
        NOW(),
        10,
        NOW(),
        NOW()
      )
    `;
    console.log('\n✓ Seeded "Most Interesting" collection row.\n');
  } else {
    console.log("\n✓ Collection row already exists.\n");
  }

  console.log(`\n=== Processing + uploading top ${top} photos → R2: ${collection}/ ===\n`);

  let ok = 0, skipped = 0, failed = 0;

  for (let i = 0; i < topPhotos.length; i++) {
    const { meta, score } = topPhotos[i];
    const photoId = String(meta.id);
    const rank    = i + 1;

    const imgPath = imageIndex.get(photoId);
    if (!imgPath) {
      console.log(`  [${rank}/${top}] SKIP  ${photoId} — no image file found`);
      skipped++;
      continue;
    }

    // Check already in DB
    const [existing] = await sql`
      SELECT id FROM gallery_photos WHERE source = 'flickr' AND source_id = ${photoId} LIMIT 1
    `;
    if (existing) {
      console.log(`  [${rank}/${top}] SKIP  ${photoId} — already in DB`);
      skipped++;
      continue;
    }

    // R2 key organised by collection: {collection}/photo-{id}.webp
    const r2Key = `${collection}/photo-${photoId}.webp`;
    const r2Url = `${R2_PUBLIC_BASE}/${r2Key}`;
    const destPath = path.join(__dirname, `../tmp_webp_${photoId}.webp`);

    try {
      // Process with Sharp → WebP, max 1920px wide
      const image = sharp(imgPath).rotate(); // auto-rotate from EXIF
      const meta2 = await image.metadata();
      const pipeline = meta2.width && meta2.width > 1920
        ? image.resize({ width: 1920, withoutEnlargement: true })
        : image;

      const webpBuffer = await pipeline
        .webp({ quality: 85, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      const { info } = webpBuffer;
      const buffer   = webpBuffer.data;

      // Upload to R2
      await s3.send(new PutObjectCommand({
        Bucket:      R2_BUCKET,
        Key:         r2Key,
        Body:        buffer,
        ContentType: "image/webp",
      }));

      // Insert into gallery_photos
      await sql`
        INSERT INTO gallery_photos
          (source_id, source, r2_url, title, description, date_taken,
           views, faves, interestingness_score, width, height,
           is_featured, is_active, created_at, updated_at)
        VALUES (
          ${photoId},
          'flickr',
          ${r2Url},
          ${(meta.name ?? meta.title ?? "").trim()},
          ${(meta.description ?? "").trim()},
          ${parseDateTaken(meta.date_taken)},
          ${parseInt(meta.count_views ?? "0", 10) || 0},
          ${parseInt(meta.count_faves ?? "0", 10) || 0},
          ${score},
          ${info.width},
          ${info.height},
          false,
          true,
          NOW(),
          NOW()
        )
      `;

      console.log(`  [${rank}/${top}] OK    ${photoId} → ${info.width}×${info.height} webp  score=${score}`);
      ok++;
    } catch (err) {
      console.error(`  [${rank}/${top}] FAIL  ${photoId}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  OK:      ${ok}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`\nGallery live at: /photography/collections/most-interesting\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
