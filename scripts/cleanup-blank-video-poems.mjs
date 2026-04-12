/**
 * One-off cleanup: delete video_poem rows with an empty slug or title,
 * plus any orphaned collection_items and content_links that reference them.
 *
 * Run: npm run cleanup:blank-video-poems
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

// Find blank rows
const blank = await sql`
  SELECT id, title, slug, vimeo_id, created_at
  FROM video_poems
  WHERE trim(title) = '' OR trim(slug) = '' OR trim(vimeo_id) = ''
`;

if (blank.length === 0) {
  console.log("No blank video_poem rows found. Nothing to do.");
  process.exit(0);
}

console.log(`Found ${blank.length} blank video_poem row(s):`);
for (const row of blank) {
  console.log(`  id=${row.id}  title="${row.title}"  slug="${row.slug}"  vimeo_id="${row.vimeo_id}"  created_at=${row.created_at}`);
}

const ids = blank.map((r) => r.id);

// Show what collection_items will be removed
const ciRows = await sql`
  SELECT ci.id, ci.collection_id, c.title AS collection_title
  FROM collection_items ci
  JOIN collections c ON c.id = ci.collection_id
  WHERE ci.linked_type = 'video_poem' AND ci.linked_id = ANY(${ids})
`;
if (ciRows.length > 0) {
  console.log(`\nOrphaned collection_items to remove:`);
  for (const r of ciRows) {
    console.log(`  collection_items.id=${r.id}  collection="${r.collection_title}"`);
  }
}

// Show what content_links will be removed
const clRows = await sql`
  SELECT cl.id, co.title AS essay_title
  FROM content_links cl
  JOIN content co ON co.id = cl.content_id
  WHERE cl.video_poem_id = ANY(${ids})
`;
if (clRows.length > 0) {
  console.log(`\nOrphaned content_links to remove:`);
  for (const r of clRows) {
    console.log(`  content_links.id=${r.id}  essay="${r.essay_title}"`);
  }
}

console.log("\nDeleting...");

await sql`
  DELETE FROM collection_items
  WHERE linked_type = 'video_poem' AND linked_id = ANY(${ids})
`;
console.log("  collection_items deleted.");

await sql`
  DELETE FROM content_links
  WHERE video_poem_id = ANY(${ids})
`;
console.log("  content_links deleted.");

await sql`
  DELETE FROM video_poems
  WHERE id = ANY(${ids})
`;
console.log("  video_poems deleted.");

console.log("\nDone. Verify with:");
console.log("  SELECT COUNT(*) FROM video_poems;");
