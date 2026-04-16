/**
 * Seed known online reading appearances into the online_readings table.
 *
 * Usage (from project root):
 *   node scripts/seed-online-readings.mjs
 *
 * Idempotent: skips rows whose external_url already exists.
 */

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sql = neon(process.env.DATABASE_URL);

/** Extract YouTube video ID for thumbnail auto-generation. */
function youtubeThumb(url) {
  try {
    const u = new URL(url);
    let id = null;
    if (u.hostname === "youtu.be") {
      id = u.pathname.slice(1).split("?")[0];
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v");
    }
    if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  } catch {
    // ignore
  }
  return "";
}

const readings = [
  {
    title: "Ross Belot reads from The Invisible Flock",
    date: "2021-02-01",
    platform: "youtube",
    external_url: "https://www.youtube.com/watch?v=cFvWJaZkUnc",
    description: "",
  },
  {
    title: "Maclean's — Ross Belot on climate poetry",
    date: "2025-04-01",
    platform: "tiktok",
    external_url:
      "https://www.tiktok.com/@macleansmag/video/7497261902913932599",
    thumbnail_url: "",
    description: "Maclean's Magazine TikTok feature.",
  },
  {
    title: "NAC Reading — Ross Belot",
    date: "2021-02-01",
    platform: "youtube",
    external_url: "https://www.youtube.com/watch?v=fwEuzOALuKQ",
    description: "",
  },
  // Note: https://vimeo.com/516494201 will be moved to Cloudflare R2 once
  // the upload tool is configured. Add it here once the R2 URL is known.
];

async function run() {
  let inserted = 0;
  let skipped = 0;

  for (const reading of readings) {
    // Check if this external_url already exists
    if (reading.external_url) {
      const existing = await sql`
        SELECT id FROM online_readings WHERE external_url = ${reading.external_url} LIMIT 1
      `;
      if (existing.length > 0) {
        console.log(`  SKIP (already exists): ${reading.title}`);
        skipped++;
        continue;
      }
    }

    // Auto-derive YouTube thumbnail if not supplied
    const thumbnail =
      reading.thumbnail_url ??
      (reading.platform === "youtube" && reading.external_url
        ? youtubeThumb(reading.external_url)
        : "");

    await sql`
      INSERT INTO online_readings
        (title, date, platform, external_url, r2_url, thumbnail_url, description, published, display_order)
      VALUES (
        ${reading.title},
        ${reading.date},
        ${reading.platform},
        ${reading.external_url ?? null},
        ${reading.r2_url ?? null},
        ${thumbnail},
        ${reading.description ?? ""},
        false,
        0
      )
    `;
    console.log(`  INSERT: ${reading.title}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
