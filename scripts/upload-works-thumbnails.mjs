/**
 * Download thumbnails for the /work page hub cards and save to site_settings.
 *   Commentary: National Observer logo (SVG)
 *   Essays:     Montaigne portrait from Project Gutenberg (public domain)
 *   Literary:   Moving to Climate Change Hours cover (already in Vercel Blob)
 *
 * Run from the repo root:  node scripts/upload-works-thumbnails.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";

const sql = neon(process.env.DATABASE_URL);

// ── 1. Download & upload National Observer logo ──────────────────────────────
console.log("Downloading National Observer logo…");
const logoRes = await fetch(
  "https://www.nationalobserver.com/themes/custom/cno/images/no_logos/logo_header.svg"
);
if (!logoRes.ok) throw new Error(`Failed to fetch NO logo: ${logoRes.status}`);
const logoBlob = await logoRes.blob();
const logoUpload = await put("national-observer-logo.svg", logoBlob, {
  access: "public",
  addRandomSuffix: false,
  contentType: "image/svg+xml",
  token: process.env.BLOB_READ_WRITE_TOKEN,
});
console.log(`  ✓ Uploaded: ${logoUpload.url}`);

// ── 2. Download & upload Montaigne portrait (public domain, Project Gutenberg) ─
console.log("Downloading Montaigne portrait…");
const montaigneRes = await fetch(
  "https://www.gutenberg.org/files/3600/3600-h/images/cover.jpg"
);
if (!montaigneRes.ok) throw new Error(`Failed to fetch Montaigne image: ${montaigneRes.status}`);
const montaigneBlob = await montaigneRes.blob();
const montaigneUpload = await put("montaigne-essays-cover.jpg", montaigneBlob, {
  access: "public",
  addRandomSuffix: false,
  contentType: "image/jpeg",
  token: process.env.BLOB_READ_WRITE_TOKEN,
});
console.log(`  ✓ Uploaded: ${montaigneUpload.url}`);

// ── 3. MTCCH cover already in Vercel Blob — use existing URL ─────────────────
const mtcchUrl =
  "https://9fpv2nlpdtxpsndy.public.blob.vercel-storage.com/9781989496121-pRjj8bsMCntOX1BlGdYofJemtRmrGa.jpg";
console.log(`  ✓ MTCCH cover: ${mtcchUrl}`);

// ── 4. Upsert all three site_settings ────────────────────────────────────────
console.log("\nSaving to site_settings…");

await sql`
  INSERT INTO site_settings (key, value, updated_at)
  VALUES ('works_hub_commentary_thumbnail', ${logoUpload.url}, NOW())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
`;
console.log("  ✓ works_hub_commentary_thumbnail");

await sql`
  INSERT INTO site_settings (key, value, updated_at)
  VALUES ('works_hub_essays_thumbnail', ${montaigneUpload.url}, NOW())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
`;
console.log("  ✓ works_hub_essays_thumbnail");

await sql`
  INSERT INTO site_settings (key, value, updated_at)
  VALUES ('works_hub_literary_thumbnail', ${mtcchUrl}, NOW())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
`;
console.log("  ✓ works_hub_literary_thumbnail");

console.log("\nDone. Visit /work to see all three thumbnails.");
