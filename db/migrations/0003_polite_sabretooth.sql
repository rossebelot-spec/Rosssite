CREATE TABLE "content" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"topic" text DEFAULT '' NOT NULL,
	"body_html" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"video_poem_id" integer,
	"collection_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_links" ADD CONSTRAINT "content_links_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_links" ADD CONSTRAINT "content_links_video_poem_id_video_poems_id_fk" FOREIGN KEY ("video_poem_id") REFERENCES "public"."video_poems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_links" ADD CONSTRAINT "content_links_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_type_idx" ON "content" USING btree ("type");--> statement-breakpoint
CREATE INDEX "content_links_content_id_idx" ON "content_links" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "content_links_video_poem_id_idx" ON "content_links" USING btree ("video_poem_id");--> statement-breakpoint
CREATE INDEX "content_links_collection_id_idx" ON "content_links" USING btree ("collection_id");