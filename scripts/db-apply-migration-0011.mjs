/**
 * Apply db/migrations/0011_content_image_about.sql using Neon's HTTP driver
 * (same as the app). Use when `npm run db:migrate` / drizzle-kit fails on websocket.
 *
 * Run: node scripts/db-apply-migration-0011.mjs
 *
 * Idempotent — safe to run more than once. Afterwards run `npm run db:migrate`
 * so Drizzle's journal records the migration when migrate succeeds.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { config } = await import("dotenv");
config({ path: path.resolve(__dirname, "../.env.local") });

const { neon } = await import("@neondatabase/serverless");

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: Set DATABASE_URL or DATABASE_URL_UNPOOLED in .env.local");
  process.exit(1);
}

const sql = neon(url);

const DO_MIGRATE_ABOUT = `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'about_page'
  ) THEN
    INSERT INTO "content" (
      "type",
      "title",
      "slug",
      "topic",
      "body_html",
      "image_url",
      "description",
      "tags",
      "published",
      "published_at",
      "created_at",
      "updated_at"
    )
    SELECT
      'about',
      ap.title,
      'about',
      '',
      ap.body_html,
      ap.photo_url,
      '',
      ARRAY[]::text[],
      true,
      ap.updated_at,
      ap.updated_at,
      ap.updated_at
    FROM (SELECT * FROM "about_page" ORDER BY "id" LIMIT 1) AS ap
    WHERE NOT EXISTS (
      SELECT 1 FROM "content" WHERE "type" = 'about' AND "slug" = 'about'
    );
  END IF;
END $$;
`;

console.log("Applying 0011 (HTTP): add content.image_url and optional about_page migration…");

await sql`ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "image_url" text`;
console.log("  ✓ image_url");

await sql.query(DO_MIGRATE_ABOUT, []);
console.log("  ✓ about_page → content (skipped if no about_page table)");

await sql`DROP TABLE IF EXISTS "about_page"`;
console.log("  ✓ about_page table dropped if it existed");

console.log("\nOK. If drizzle journal is behind, run: npm run db:migrate");
