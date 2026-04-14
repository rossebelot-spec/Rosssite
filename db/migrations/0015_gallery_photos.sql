CREATE TABLE "gallery_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"source" text DEFAULT 'flickr' NOT NULL,
	"r2_url" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"date_taken" timestamp,
	"views" integer DEFAULT 0 NOT NULL,
	"faves" integer DEFAULT 0 NOT NULL,
	"interestingness_score" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_photos_source_unique" ON "gallery_photos" USING btree ("source","source_id");
--> statement-breakpoint
CREATE INDEX "gallery_photos_active_score_idx" ON "gallery_photos" USING btree ("is_active","interestingness_score");
--> statement-breakpoint
CREATE INDEX "gallery_photos_featured_idx" ON "gallery_photos" USING btree ("is_featured");
