CREATE TABLE "online_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"platform" text NOT NULL DEFAULT 'youtube',
	"external_url" text,
	"r2_url" text,
	"thumbnail_url" text NOT NULL DEFAULT '',
	"description" text NOT NULL DEFAULT '',
	"display_order" integer NOT NULL DEFAULT 0,
	"published" boolean NOT NULL DEFAULT false,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);
