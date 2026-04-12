-- Rename table: video_poems → videos
ALTER TABLE "video_poems" RENAME TO "videos";--> statement-breakpoint

-- Rename column: content_links.video_poem_id → video_id
ALTER TABLE "content_links" RENAME COLUMN "video_poem_id" TO "video_id";--> statement-breakpoint

-- Update linkedType discriminator values in collection_items
UPDATE "collection_items" SET "linked_type" = 'video' WHERE "linked_type" = 'video_poem';--> statement-breakpoint

-- Rename index on content_links
DROP INDEX IF EXISTS "content_links_video_poem_id_idx";--> statement-breakpoint
CREATE INDEX "content_links_video_id_idx" ON "content_links" ("video_id");
