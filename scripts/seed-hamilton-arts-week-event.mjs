/**
 * Seed the Hamilton Arts Week virtual reading event.
 *
 * Run from the repo root:  node scripts/seed-hamilton-arts-week-event.mjs
 *
 * Date confirmed from Wolsak & Wynn event page: Tuesday, June 8, 2021, 6:00–7:00 PM.
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

// Confirmed from Wolsak & Wynn event page: Tuesday, June 8, 2021, 6:00–7:00 PM
const EVENT_DATE = "2021-06-08";

const link = "https://www.wolsakandwynn.ca/events/hamilton-arts-week-ross-belot-8phx4";

const existing = await sql`SELECT id FROM site_events WHERE link = ${link} LIMIT 1`;
if (existing.length > 0) {
  console.log("Already exists — skipping.");
  process.exit(0);
}

await sql`
  INSERT INTO site_events
    (title, date, location, description, link, display_order, published)
  VALUES (
    'Hamilton Arts Week: Virtual Reading',
    ${EVENT_DATE},
    'Online (Hamilton Arts Week)',
    'Virtual reading from Moving to Climate Change Hours, with Canada Council for the Arts funded video poems based on selected poems from the collection. Presented by Wolsak & Wynn.',
    ${link},
    50,
    true
  )
`;

console.log("✓  Hamilton Arts Week virtual reading event seeded.");
