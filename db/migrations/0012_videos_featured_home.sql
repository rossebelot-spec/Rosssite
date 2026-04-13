ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "is_featured_for_home" boolean NOT NULL DEFAULT false;

-- At most one featured row (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS "videos_one_featured_home_idx" ON "videos" ((1)) WHERE "is_featured_for_home" = true;

-- Backfill from legacy slug/title resolution (same order as former `getFeaturedHomeVideo()`).
-- Plain SQL only (no PL/pgSQL) so `drizzle-kit migrate` applies reliably on Neon/pg.
UPDATE videos
SET is_featured_for_home = true
WHERE id = (
  SELECT COALESCE(
    (SELECT id FROM videos WHERE published = true AND slug = 'lac-megantic' LIMIT 1),
    (
      SELECT id
      FROM videos
      WHERE published = true AND slug LIKE 'lac-megantic%'
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1
    ),
    (
      SELECT id
      FROM videos
      WHERE published = true AND title ILIKE '%Mégantic%'
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1
    ),
    (
      SELECT id
      FROM videos
      WHERE published = true AND title ILIKE '%Megantic%'
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1
    )
  )
);
