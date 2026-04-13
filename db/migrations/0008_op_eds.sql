CREATE TABLE "op_ed_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"publication" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"masthead_url" text,
	"description" text NOT NULL DEFAULT '',
	"display_order" integer NOT NULL DEFAULT 0,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "op_eds" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer REFERENCES "op_ed_collections"("id") ON DELETE set null,
	"publication" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"date" text NOT NULL,
	"summary" text NOT NULL DEFAULT '',
	"pull_quote" text,
	"thumbnail_url" text,
	"display_order" integer NOT NULL DEFAULT 0,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "op_eds_collection_id_idx" ON "op_eds" ("collection_id");
