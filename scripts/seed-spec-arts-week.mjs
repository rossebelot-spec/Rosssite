/**
 * Seed: Hamilton Spectator — Hamilton Arts Week 2021 coverage
 * Usage: node scripts/seed-spec-arts-week.mjs
 */

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sql = neon(process.env.DATABASE_URL);

const item = {
  kind: "coverage",
  title: "Hamilton Arts Week 2021 — an empowering-packed nine days of events, performances and programming",
  outlet: "The Hamilton Spectator",
  date: "2021-05-26",
  url: "https://www.thespec.com/entertainment/hamilton-arts-week-2021-an-empowering-packed-nine-days-of-events-performances-and-programming/article_dc6ae504-a52e-5186-9a72-1a379f849442.html",
  description: "",
};

async function run() {
  const existing = await sql`
    SELECT id FROM news_items WHERE url = ${item.url} LIMIT 1
  `;
  if (existing.length > 0) {
    console.log("SKIP — already exists:", item.title);
    return;
  }

  await sql`
    INSERT INTO news_items (kind, title, outlet, date, url, description, published, display_order)
    VALUES (
      ${item.kind},
      ${item.title},
      ${item.outlet},
      ${item.date},
      ${item.url},
      ${item.description},
      false,
      0
    )
  `;
  console.log("INSERT:", item.title);
}

run().catch((err) => { console.error(err); process.exit(1); });
