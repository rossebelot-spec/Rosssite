import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const essays = pgTable("essays", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  bodyHtml: text("body_html").notNull().default(""),
  description: text("description").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookReviews = pgTable("book_reviews", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  author: text("author").notNull(),
  bodyHtml: text("body_html").notNull().default(""),
  description: text("description").notNull().default(""),
  rating: integer("rating"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  blobUrl: text("blob_url").notNull(),
  caption: text("caption").notNull().default(""),
  alt: text("alt").notNull().default(""),
  takenAt: timestamp("taken_at"),
  displayOrder: integer("display_order").notNull().default(0),
  isHero: boolean("is_hero").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Video Poems ────────────────────────────────────────────────────────────

export const videoPoems = pgTable("video_poems", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  vimeoId: text("vimeo_id").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  thumbnailAlt: text("thumbnail_alt").notNull().default(""),
  essayHtml: text("essay_html").notNull().default(""),
  description: text("description").notNull().default(""),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Collections ────────────────────────────────────────────────────────────

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  introHtml: text("intro_html").notNull().default(""),
  description: text("description").notNull().default(""),
  coverImageUrl: text("cover_image_url"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Collection Items (join table with ordering) ────────────────────────────

export const collectionItems = pgTable(
  "collection_items",
  {
    id: serial("id").primaryKey(),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    videoPoemId: integer("video_poem_id")
      .notNull()
      .references(() => videoPoems.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("collection_items_collection_poem_unique").on(
      table.collectionId,
      table.videoPoemId
    ),
    index("collection_items_collection_position_idx").on(
      table.collectionId,
      table.position
    ),
    index("collection_items_video_poem_id_idx").on(table.videoPoemId),
  ]
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const collectionsRelations = relations(collections, ({ many }) => ({
  items: many(collectionItems),
}));

export const videoPoemsRelations = relations(videoPoems, ({ many }) => ({
  items: many(collectionItems),
}));

export const collectionItemsRelations = relations(
  collectionItems,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionItems.collectionId],
      references: [collections.id],
    }),
    videoPoem: one(videoPoems, {
      fields: [collectionItems.videoPoemId],
      references: [videoPoems.id],
    }),
  })
);

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type Essay = typeof essays.$inferSelect;
export type NewEssay = typeof essays.$inferInsert;
export type BookReview = typeof bookReviews.$inferSelect;
export type NewBookReview = typeof bookReviews.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type VideoPoem = typeof videoPoems.$inferSelect;
export type NewVideoPoem = typeof videoPoems.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type NewCollectionItem = typeof collectionItems.$inferInsert;
