/**
 * Upsert the featured Lac-Mégantic video (R2 MP4) for the home page.
 *
 * Requires: DATABASE_URL or DATABASE_URL_UNPOOLED in .env.local
 * Run: node scripts/seed-lac-megantic-video.mjs
 *
 * Matches `FEATURED_HOME_VIDEO_SLUG` in `lib/featured-home-video.ts` (slug: lac-megantic).
 * Vimeo ID is a placeholder ("0") because playback uses `r2_url` in the video UI.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { config } = await import("dotenv");
config({ path: path.resolve(__dirname, "../.env.local") });

const { neon } = await import("@neondatabase/serverless");

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: DATABASE_URL not set in .env.local");
  process.exit(1);
}

const R2_MP4 =
  "https://pub-d8957166d20c44e78b0fef5b4d25a13d.r2.dev/lac-m-gantic.mp4";

const sql = neon(url);

await sql`
  INSERT INTO videos (
    title,
    slug,
    vimeo_id,
    r2_url,
    thumbnail_url,
    thumbnail_alt,
    description,
    published,
    published_at,
    updated_at
  )
  VALUES (
    'Lac-Mégantic',
    'lac-megantic',
    '0',
    ${R2_MP4},
    '',
    '',
    'Poem film.',
    true,
    now(),
    now()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    vimeo_id = EXCLUDED.vimeo_id,
    r2_url = EXCLUDED.r2_url,
    description = EXCLUDED.description,
    published = EXCLUDED.published,
    published_at = COALESCE(videos.published_at, EXCLUDED.published_at),
    updated_at = now();
`;

console.log("OK: videos slug lac-megantic upserted with R2 MP4 URL.");
