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

// ─── Videos ─────────────────────────────────────────────────────────────────

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  vimeoId: text("vimeo_id").notNull(),
  /** Optional Cloudflare R2 (or other) direct MP4 URL; when set, collection/single video UI prefers this over Vimeo. */
  r2Url: text("r2_url"),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  thumbnailAlt: text("thumbnail_alt").notNull().default(""),
  description: text("description").notNull().default(""),
  durationSeconds: integer("duration_seconds"),
  /** At most one video may be true; home hero + “Featured video” column use this row. */
  isFeaturedForHome: boolean("is_featured_for_home").notNull().default(false),
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
    type: text("type").notNull(), // essay | blog | review | news | event | about
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    topic: text("topic").notNull().default(""),
    bodyHtml: text("body_html").notNull().default(""),
    /** Optional hero/portrait (e.g. About page); prefer Vercel Blob JPEG URL. */
    imageUrl: text("image_url"),
    description: text("description").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("content_type_idx").on(table.type)]
);

// ─── Content Links (content ↔ video / collection) ───────────────────────────

export const contentLinks = pgTable(
  "content_links",
  {
    id: serial("id").primaryKey(),
    contentId: integer("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    videoId: integer("video_id").references(() => videos.id, {
      onDelete: "cascade",
    }),
    collectionId: integer("collection_id").references(() => collections.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("content_links_content_id_idx").on(table.contentId),
    index("content_links_video_id_idx").on(table.videoId),
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
  video: one(videos, {
    fields: [contentLinks.videoId],
    references: [videos.id],
  }),
  collection: one(collections, {
    fields: [contentLinks.collectionId],
    references: [collections.id],
  }),
}));

// ─── Op-ed Collections (one per publication) ────────────────────────────────

export const opEdCollections = pgTable("op_ed_collections", {
  id: serial("id").primaryKey(),
  publication: text("publication").notNull(),        // "Canada's National Observer"
  slug: text("slug").notNull().unique(),              // "national-observer"
  mastheadUrl: text("masthead_url"),                  // path to local SVG or blob URL
  description: text("description").notNull().default(""),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Op-eds ─────────────────────────────────────────────────────────────────

export const opEds = pgTable(
  "op_eds",
  {
    id: serial("id").primaryKey(),
    collectionId: integer("collection_id").references(() => opEdCollections.id, {
      onDelete: "set null",
    }),
    publication: text("publication").notNull(),       // kept for standalone articles
    title: text("title").notNull(),
    url: text("url").notNull(),
    date: text("date").notNull(),                     // ISO date string "YYYY-MM-DD"
    summary: text("summary").notNull().default(""),
    pullQuote: text("pull_quote"),
    thumbnailUrl: text("thumbnail_url"),
    /** Draft op-eds are hidden from public routes; existing rows migrate as published. */
    published: boolean("published").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("op_eds_collection_id_idx").on(table.collectionId)]
);

// ─── Op-ed Relations ────────────────────────────────────────────────────────

export const opEdCollectionsRelations = relations(opEdCollections, ({ many }) => ({
  articles: many(opEds),
}));

export const opEdsRelations = relations(opEds, ({ one }) => ({
  collection: one(opEdCollections, {
    fields: [opEds.collectionId],
    references: [opEdCollections.id],
  }),
}));

// ─── Press & events (editorial lists; admin-managed like op-eds) ────────────

export const pressItems = pgTable("press_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  outlet: text("outlet").notNull(),
  /** ISO date string YYYY-MM-DD */
  date: text("date").notNull(),
  url: text("url"),
  description: text("description").notNull().default(""),
  published: boolean("published").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const siteEvents = pgTable("site_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull().default(""),
  link: text("link"),
  published: boolean("published").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type NewCollectionItem = typeof collectionItems.$inferInsert;
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type ContentLink = typeof contentLinks.$inferSelect;
export type NewContentLink = typeof contentLinks.$inferInsert;
export type OpEdCollection = typeof opEdCollections.$inferSelect;
export type NewOpEdCollection = typeof opEdCollections.$inferInsert;
export type OpEd = typeof opEds.$inferSelect;
export type NewOpEd = typeof opEds.$inferInsert;
export type PressItemRow = typeof pressItems.$inferSelect;
export type SiteEventRow = typeof siteEvents.$inferSelect;

export type ContentType =
  | "essay"
  | "blog"
  | "review"
  | "news"
  | "event"
  | "about";
export type CollectionItemLinkedType = "video" | "photo";
