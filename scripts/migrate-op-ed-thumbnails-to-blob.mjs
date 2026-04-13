/**
 * Download remote op-ed thumbnails, re-encode as JPEG, upload to Vercel Blob,
 * UPDATE op_eds.thumbnail_url to the public blob URL.
 *
 * Skips: NULL thumbs, already-blob URLs, non-HTTP URLs (e.g. /thumbnails/...).
 *
 * Usage:
 *   node scripts/migrate-op-ed-thumbnails-to-blob.mjs           # run all
 *   node scripts/migrate-op-ed-thumbnails-to-blob.mjs --dry-run
 *   node scripts/migrate-op-ed-thumbnails-to-blob.mjs --limit 3
 *
 * Requires .env.local: DATABASE_URL (or UNPOOLED), BLOB_READ_WRITE_TOKEN
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(__dirname, "../.env.local") });

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; ROSSSITE-thumbnail-migration/1.0; +https://rossbelot.ca)",
  Accept: "image/*,*/*;q=0.8",
};

function parseArgs(argv) {
  let dryRun = false;
  let limit = Infinity;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") dryRun = true;
    if (argv[i] === "--limit" && argv[i + 1])
      limit = Math.max(1, parseInt(String(argv[++i]), 10) || 1);
  }
  return { dryRun, limit };
}

function isHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isBlobUrl(s) {
  return /\.blob\.vercel-storage\.com|\.public\.blob\.vercel-storage\.com/i.test(s);
}

async function main() {
  const { dryRun, limit } = parseArgs(process.argv.slice(2));

  const dbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set in .env.local");
    process.exit(1);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN not set in .env.local");
    process.exit(1);
  }

  const sql = neon(dbUrl);

  const rows = await sql`
    SELECT id, title, thumbnail_url
    FROM op_eds
    WHERE thumbnail_url IS NOT NULL
      AND TRIM(thumbnail_url) <> ''
    ORDER BY id
  `;

  const toProcess = rows.filter((r) => {
    const t = r.thumbnail_url;
    if (!isHttpUrl(t)) return false;
    if (isBlobUrl(t)) return false;
    return true;
  });

  const slice = toProcess.slice(0, limit);

  console.log(
    `\nOp-ed thumbnails: ${rows.length} total rows, ${toProcess.length} remote http(s) to migrate` +
      (limit < Infinity ? ` (processing ${slice.length} with --limit)` : "") +
      `${dryRun ? " [DRY-RUN]" : ""}\n`
  );

  let ok = 0;
  let fail = 0;
  let skipped = 0;

  for (const row of slice) {
    const sourceUrl = row.thumbnail_url;
    const pathname = `op-eds/thumbnails/${row.id}.jpg`;

    if (dryRun) {
      console.log(`[dry-run] id=${row.id} ← ${sourceUrl}`);
      console.log(`          → ${pathname} (blob)`);
      continue;
    }

    try {
      const res = await fetch(sourceUrl, { headers: FETCH_HEADERS, redirect: "follow" });
      if (!res.ok) {
        console.error(`FAIL id=${row.id} fetch ${res.status} ${sourceUrl}`);
        fail++;
        continue;
      }

      const buf = Buffer.from(await res.arrayBuffer());
      const jpeg = await sharp(buf)
        .rotate()
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();

      const blob = await put(pathname, jpeg, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      await sql`
        UPDATE op_eds
        SET thumbnail_url = ${blob.url}, updated_at = NOW()
        WHERE id = ${row.id}
      `;

      console.log(`OK   id=${row.id} ${blob.url}`);
      ok++;
    } catch (err) {
      console.error(
        `FAIL id=${row.id} ${sourceUrl}`,
        err instanceof Error ? err.message : err
      );
      fail++;
    }
  }

  skipped = rows.length - toProcess.length;
  console.log(
    `\nDone. ok=${ok} fail=${fail} skipped-non-http-or-blob=${skipped}` +
      (dryRun ? " (no DB or blob changes)" : "")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
