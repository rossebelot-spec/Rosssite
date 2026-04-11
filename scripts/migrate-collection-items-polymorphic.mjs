/**
 * Phase B backfill: populate linked_type / linked_id from video_poem_id
 * on all existing collection_items rows.
 *
 * Run: npm run migrate:collection-items-polymorphic
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { config } = await import("dotenv");
config({ path: path.resolve(__dirname, "../.env.local") });

const { neon } = await import("@neondatabase/serverless");

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: DATABASE_URL or DATABASE_URL_UNPOOLED not set");
  process.exit(1);
}

const sql = neon(url);

// Count nulls before
const [{ before }] = await sql`
  SELECT COUNT(*) AS before
  FROM collection_items
  WHERE linked_type IS NULL
`;
console.log(`Rows with linked_type IS NULL (before): ${before}`);

// Backfill
await sql`
  UPDATE collection_items
  SET linked_type = 'video_poem',
      linked_id   = video_poem_id
  WHERE linked_type IS NULL
`;
console.log("UPDATE executed.");

// Verify
const [{ after }] = await sql`
  SELECT COUNT(*) AS after
  FROM collection_items
  WHERE linked_type IS NULL OR linked_id IS NULL
`;
console.log(`Rows with linked_type or linked_id IS NULL (after): ${after}`);

if (Number(after) !== 0) {
  console.error(`ERROR: ${after} row(s) still have NULL — backfill incomplete`);
  process.exit(1);
}

console.log("Backfill complete. All rows have linked_type and linked_id set.");
