/**
 * One-off: upload Compressed/*.mp4 to Cloudflare R2 and set videos.r2_url.
 *
 * Plan only (default — no uploads, no credential prompts):
 *   node scripts/migrate-videos-to-r2.mjs
 *
 * Upload + DB update (prompts for R2 Access Key ID and Secret at runtime):
 *   npx -y -p @aws-sdk/client-s3@3 node scripts/migrate-videos-to-r2.mjs --execute
 *
 * Env:
 *   DATABASE_URL — required (from .env.local)
 *   COMPRESSED_DIR — override folder (default: /Volumes/Archive/VimeoMasters/Compressed)
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(__dirname, "../.env.local") });

const DEFAULT_COMPRESSED = "/Volumes/Archive/VimeoMasters/Compressed";

const R2_ACCOUNT_ID = "87e1212f0dca896abd2b40062520b511";
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_BUCKET = "videos";
const R2_PUBLIC_BASE = "https://pub-d8957166d20c44e78b0fef5b4d25a13d.r2.dev";

function parseArgs(argv) {
  let execute = false;
  for (const a of argv) {
    if (a === "--execute") execute = true;
  }
  return { execute };
}

/** @param {string} dir */
async function listMp4Files(dir) {
  const names = await fs.readdir(dir);
  return names
    .filter((n) => n.toLowerCase().endsWith(".mp4"))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Match DB slug to disk file: prefer exact stem match (case-insensitive).
 * @param {string} slug
 * @param {Map<string, string>} stemToName — lowercase stem -> full filename
 */
function findFileForSlug(slug, stemToName) {
  const key = slug.trim().toLowerCase();
  if (stemToName.has(key)) return stemToName.get(key);
  return null;
}

async function main() {
  const { execute } = parseArgs(process.argv.slice(2));
  const compressedDir =
    process.env.COMPRESSED_DIR?.trim() || DEFAULT_COMPRESSED;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set (check .env.local).");
    process.exit(1);
  }

  let stat;
  try {
    stat = await fs.stat(compressedDir);
  } catch {
    console.error(`Compressed folder not found or unreadable: ${compressedDir}`);
    console.error("Set COMPRESSED_DIR to the folder that contains the .mp4 files.");
    process.exit(1);
  }
  if (!stat.isDirectory()) {
    console.error(`Not a directory: ${compressedDir}`);
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  const rows = await sql`
    SELECT id, title, slug, r2_url
    FROM videos
    WHERE r2_url IS NULL
    ORDER BY id
  `;

  const mp4Names = await listMp4Files(compressedDir);
  /** @type {Map<string, string>} */
  const stemToName = new Map();
  for (const name of mp4Names) {
    const stem = name.replace(/\.mp4$/i, "");
    stemToName.set(stem.toLowerCase(), name);
  }

  console.log("\n=== R2 migration plan (r2_url IS NULL only) ===\n");
  console.log(`Compressed dir: ${compressedDir}`);
  console.log(`MP4 files on disk: ${mp4Names.length}`);
  console.log(`Videos needing r2_url: ${rows.length}\n`);

  /** @type {{ id: number, slug: string, title: string, file: string | null, key: string | null, publicUrl: string | null }[]} */
  const planned = [];

  for (const row of rows) {
    const fileName = findFileForSlug(row.slug, stemToName);
    const key = fileName;
    const publicUrl = key
      ? `${R2_PUBLIC_BASE.replace(/\/$/, "")}/${encodeURIComponent(key).replace(/%2F/g, "/")}`
      : null;
    planned.push({
      id: row.id,
      slug: row.slug,
      title: row.title,
      file: fileName,
      key,
      publicUrl,
    });
  }

  console.log(
    "Proposed mapping (slug ↔ filename on disk; URL = public base + key):\n"
  );
  console.log(
    [
      "id".padEnd(6),
      "slug".padEnd(42),
      "local file".padEnd(48),
      "OK?",
    ].join("  ")
  );
  console.log("-".repeat(120));

  for (const p of planned) {
    const ok = p.file ? "yes" : "NO FILE";
    console.log(
      [
        String(p.id).padEnd(6),
        p.slug.padEnd(42),
        (p.file ?? "(missing)").padEnd(48),
        ok,
      ].join("  ")
    );
  }

  const missingFiles = planned.filter((p) => !p.file);
  const extraOnDisk = mp4Names.filter((name) => {
    const stem = name.replace(/\.mp4$/i, "").toLowerCase();
    return !rows.some((r) => r.slug.toLowerCase() === stem);
  });

  if (missingFiles.length) {
    console.log("\n--- Rows without a matching {slug}.mp4 (case-insensitive) ---");
    for (const p of missingFiles) {
      console.log(`  id=${p.id} slug=${p.slug} title=${p.title}`);
    }
  }

  if (extraOnDisk.length) {
    console.log(
      "\n--- MP4 files on disk with no matching video row (among r2_url IS NULL slugs) ---"
    );
    for (const n of extraOnDisk) console.log(`  ${n}`);
  }

  console.log(
    "\n--- Stop (plan only). Review the mapping. When ready to upload and update DB, run: ---"
  );
  console.log(
    "  npx -y -p @aws-sdk/client-s3@3 node scripts/migrate-videos-to-r2.mjs --execute\n"
  );

  if (!execute) {
    process.exit(0);
  }

  // ─── Execute: upload + update ───────────────────────────────────────────
  if (missingFiles.length) {
    console.error(
      "Cannot --execute: fix missing files or slugs first (see NO FILE rows)."
    );
    process.exit(1);
  }

  let S3Client;
  let PutObjectCommand;
  try {
    const mod = await import("@aws-sdk/client-s3");
    S3Client = mod.S3Client;
    PutObjectCommand = mod.PutObjectCommand;
  } catch {
    console.error(
      "Could not import @aws-sdk/client-s3. Run:\n" +
        "  npx -y -p @aws-sdk/client-s3@3 node scripts/migrate-videos-to-r2.mjs --execute"
    );
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });
  const accessKeyId = (await rl.question("R2 Access Key ID: ")).trim();
  const secretAccessKey = (await rl.question("R2 Secret Access Key: ")).trim();
  await rl.close();

  if (!accessKeyId || !secretAccessKey) {
    console.error("Access Key ID and Secret Access Key are required.");
    process.exit(1);
  }

  const client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  console.log("\n=== Upload + DB update ===\n");

  for (const p of planned) {
    const localPath = path.join(compressedDir, p.file);
    const body = createReadStream(localPath);
    const key = p.key;

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: "video/mp4",
        })
      );
      const r2Url = `${R2_PUBLIC_BASE.replace(/\/$/, "")}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

      await sql`
        UPDATE videos
        SET r2_url = ${r2Url}, updated_at = NOW()
        WHERE id = ${p.id}
      `;

      console.log(`OK   id=${p.id} slug=${p.slug} → ${r2Url}`);
    } catch (err) {
      console.error(
        `FAIL id=${p.id} slug=${p.slug} file=${p.file}`,
        err instanceof Error ? err.message : err
      );
    }
  }

  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
