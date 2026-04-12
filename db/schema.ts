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
  description: text("description").notNull().default(""),
  durationSeconds: integer("duration_seconds"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
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
    linkedType: text("linked_type").notNull(),
    linkedId: integer("linked_id").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("collection_items_collection_linked_unique").on(
      table.collectionId,
      table.linkedType,
      table.linkedId
    ),
    index("collection_items_collection_position_idx").on(
      table.collectionId,
      table.position
    ),
    index("collection_items_linked_idx").on(table.linkedType, table.linkedId),
  ]
);

// ─── Unified Content ────────────────────────────────────────────────────────

export const content = pgTable(
  "content",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(), // essay | blog | review | news | event
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    topic: text("topic").notNull().default(""),
    bodyHtml: text("body_html").notNull().default(""),
    description: text("description").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("content_type_idx").on(table.type)]
);

// ─── Content Links (content ↔ video poem / collection) ─────────────────────

export const contentLinks = pgTable(
  "content_links",
  {
    id: serial("id").primaryKey(),
    contentId: integer("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    videoPoemId: integer("video_poem_id").references(() => videoPoems.id, {
      onDelete: "cascade",
    }),
    collectionId: integer("collection_id").references(() => collections.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("content_links_content_id_idx").on(table.contentId),
    index("content_links_video_poem_id_idx").on(table.videoPoemId),
    index("content_links_collection_id_idx").on(table.collectionId),
  ]
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const collectionsRelations = relations(collections, ({ many }) => ({
  items: many(collectionItems),
}));

export const collectionItemsRelations = relations(
  collectionItems,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionItems.collectionId],
      references: [collections.id],
    }),
  })
);

export const contentRelations = relations(content, ({ many }) => ({
  links: many(contentLinks),
}));

export const contentLinksRelations = relations(contentLinks, ({ one }) => ({
  content: one(content, {
    fields: [contentLinks.contentId],
    references: [content.id],
  }),
  videoPoem: one(videoPoems, {
    fields: [contentLinks.videoPoemId],
    references: [videoPoems.id],
  }),
  collection: one(collections, {
    fields: [contentLinks.collectionId],
    references: [collections.id],
  }),
}));

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type VideoPoem = typeof videoPoems.$inferSelect;
export type NewVideoPoem = typeof videoPoems.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type NewCollectionItem = typeof collectionItems.$inferInsert;
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type ContentLink = typeof contentLinks.$inferSelect;
export type NewContentLink = typeof contentLinks.$inferInsert;

export type ContentType = "essay" | "blog" | "review" | "news" | "event";
export type CollectionItemLinkedType = "video_poem" | "photo";
