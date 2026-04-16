-- Migration 0017: site_settings, books, literary_publications

CREATE TABLE IF NOT EXISTS "site_settings" (
  "key" text PRIMARY KEY,
  "value" text,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Seed the three works hub image keys
INSERT INTO "site_settings" ("key") VALUES
  ('works_hub_commentary_image'),
  ('works_hub_essays_image'),
  ('works_hub_literary_image')
ON CONFLICT ("key") DO NOTHING;

CREATE TABLE IF NOT EXISTS "books" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "subtitle" text NOT NULL DEFAULT '',
  "publisher" text NOT NULL,
  "year" integer NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "cover_image_url" text,
  "buy_url" text,
  "isbn" text NOT NULL DEFAULT '',
  "display_order" integer NOT NULL DEFAULT 0,
  "published" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "literary_publications" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "publication" text NOT NULL,
  "date" text NOT NULL,
  "kind" text NOT NULL DEFAULT 'journal',
  "url" text,
  "description" text NOT NULL DEFAULT '',
  "display_order" integer NOT NULL DEFAULT 0,
  "published" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
