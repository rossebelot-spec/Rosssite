-- Unified news stream (press → news_items), retire content.review → essay, collection media type

ALTER TABLE "press_items" RENAME TO "news_items";

ALTER TABLE "news_items" ADD COLUMN IF NOT EXISTS "kind" text NOT NULL DEFAULT 'coverage';
ALTER TABLE "news_items" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "news_items" ADD COLUMN IF NOT EXISTS "body_html" text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS "news_items_slug_key" ON "news_items" ("slug");

-- Long-form news posts from content → news_items (story)
INSERT INTO "news_items" (
  "title", "outlet", "date", "url", "description", "published", "display_order",
  "kind", "slug", "body_html", "created_at", "updated_at"
)
SELECT
  c.title,
  '',
  COALESCE(
    to_char((c.published_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD'),
    to_char((c.created_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
  ),
  NULL,
  c.description,
  c.published,
  0,
  'story',
  c.slug,
  c.body_html,
  c.created_at,
  c.updated_at
FROM "content" c
WHERE c.type = 'news'
  AND NOT EXISTS (SELECT 1 FROM "news_items" ni WHERE ni.slug = c.slug);

DELETE FROM "content" WHERE type = 'news';

UPDATE "content" SET type = 'essay' WHERE type = 'review';

ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "media_type" text NOT NULL DEFAULT 'video';
ALTER TABLE "collections" DROP CONSTRAINT IF EXISTS "collections_media_type_check";
ALTER TABLE "collections" ADD CONSTRAINT "collections_media_type_check" CHECK ("media_type" IN ('video', 'photo'));
