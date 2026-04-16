/**
 * Deduplication: remove duplicate literary_publications rows.
 * Keeps the row with the highest ID in each (title, publication) group
 * (the most recently inserted / most up-to-date version).
 * Run from the repo root:  node scripts/dedupe-literary-publications.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Find all groups that have more than one row for the same (title, publication)
const dupes = await sql`
  SELECT title, publication, COUNT(*) AS cnt, array_agg(id ORDER BY id) AS ids
  FROM literary_publications
  GROUP BY title, publication
  HAVING COUNT(*) > 1
`;

if (dupes.length === 0) {
  console.log("No duplicates found.");
  process.exit(0);
}

console.log(`Found ${dupes.length} duplicate group(s):\n`);

let totalDeleted = 0;

for (const row of dupes) {
  // ids are sorted ascending; keep the last (highest = most recently seeded)
  const keep = row.ids[row.ids.length - 1];
  const remove = row.ids.slice(0, -1);

  console.log(`  "${row.title}" — ${row.publication}`);
  console.log(`    keeping id=${keep}, deleting ids=${remove.join(", ")}`);

  await sql`DELETE FROM literary_publications WHERE id = ANY(${remove})`;
  totalDeleted += remove.length;
}

console.log(`\nDone. Deleted ${totalDeleted} duplicate row(s).`);
