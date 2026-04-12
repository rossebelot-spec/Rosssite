ALTER TABLE "video_poems" ADD COLUMN "published" boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE "video_poems" ADD COLUMN "published_at" timestamp;
