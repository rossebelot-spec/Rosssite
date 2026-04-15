/**
 * List videos with empty title, slug, or hosted URL (diagnostic).
 */
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { config } = await import("dotenv");
config({ path: path.resolve(__dirname, "../.env.local") });

const { neon } = await import("@neondatabase/serverless");

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(url);

const rows = await sql`
  SELECT id, title, slug, r2_url, created_at
  FROM videos
  WHERE trim(title) = '' OR trim(slug) = '' OR trim(coalesce(r2_url, '')) = ''
  ORDER BY id
`;

console.log(`Found ${rows.length} row(s) with blank title, slug, or r2_url:\n`);
for (const row of rows) {
  console.log(
    `  id=${row.id}  title="${row.title}"  slug="${row.slug}"  r2_url="${row.r2_url}"  created_at=${row.created_at}`
  );
}
