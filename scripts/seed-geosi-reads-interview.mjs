/**
 * Seed Geosi Reads interview (May 2015) as a news coverage item.
 *
 * Run from the repo root:  node scripts/seed-geosi-reads-interview.mjs
 *
 * Idempotent — checks for existing URL before inserting.
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const url = "https://geosireads.wordpress.com/2015/05/08/interview-with-canadian-writer-ross-belot/";

const existing = await sql`SELECT id FROM news_items WHERE url = ${url} LIMIT 1`;
if (existing.length > 0) {
  console.log("Already exists — skipping.");
  process.exit(0);
}

await sql`
  INSERT INTO news_items
    (kind, title, outlet, date, url, description, display_order, published)
  VALUES (
    'coverage',
    'Interview with Canadian Writer, Ross Belot',
    'Geosi Reads',
    '2015-05-08',
    ${url},
    'Interview with Ross Belot on his writing background, literary community, and early poetry career. One of his earliest published interviews.',
    5,
    true
  )
`;

console.log("✓  Geosi Reads interview (May 2015) seeded.");
