/**
 * Seed the Lit Live Reading Series appearance (April 1, 2021) as a site event.
 *
 * Run from the repo root:  node scripts/seed-litlive-event.mjs
 *
 * Source: https://litlive.blogspot.com/2021/03/
 * "April's reading!! Matthew Walsh, Bonnie Sitter, Ross Belot, Beth Follett,
 *  Jessica Moore, and Martha Baillie w/music by SOUND OF SEPARATION"
 * (Lit Live meets first Thursday of the month → April 1, 2021)
 *
 * Idempotent — checks for existing link before inserting.
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const link = "https://litlive.blogspot.com/2021/03/";

const existing = await sql`SELECT id FROM site_events WHERE link = ${link} LIMIT 1`;
if (existing.length > 0) {
  console.log("Already exists — skipping.");
  process.exit(0);
}

await sql`
  INSERT INTO site_events
    (title, date, location, description, link, display_order, published)
  VALUES (
    'Lit Live Reading Series',
    '2021-04-01',
    'Online (Hamilton)',
    'Online reading alongside Matthew Walsh, Bonnie Sitter, Beth Follett, Jessica Moore, and Martha Baillie, with music by Sound of Separation. Lit Live is Hamilton''s long-running monthly literary reading series.',
    ${link},
    51,
    true
  )
`;

console.log("✓  Lit Live Reading Series — April 1, 2021 seeded.");
