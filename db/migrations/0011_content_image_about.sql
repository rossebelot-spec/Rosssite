ALTER TABLE "content" ADD COLUMN IF NOT EXISTS "image_url" text;

-- Migrate legacy about_page into content when that table still exists (0010).
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

DROP TABLE IF EXISTS "about_page";
