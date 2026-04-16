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
  /** Public HTTPS URL for the MP4 (e.g. Cloudflare R2). Required for playback. */
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
  /** `video` = video poems; `photo` = photography sets — same listing UX, labelled on multimedia. */
  mediaType: text("media_type").notNull().default("video"),
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
    type: text("type").notNull(), // essay | blog | event | about
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

// ─── News (coverage, announcements, optional on-site stories) & site events ─

export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  /** coverage = external clip; announcement = launch/book note; story = on-site HTML body */
  kind: text("kind").notNull().default("coverage"),
  title: text("title").notNull(),
  slug: text("slug").unique(),
  outlet: text("outlet").notNull().default(""),
  /** ISO date string YYYY-MM-DD */
  date: text("date").notNull(),
  url: text("url"),
  description: text("description").notNull().default(""),
  bodyHtml: text("body_html").notNull().default(""),
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

// ─── Gallery Photos ──────────────────────────────────────────────────────────

export const galleryPhotos = pgTable(
  "gallery_photos",
  {
    id: serial("id").primaryKey(),
    /** Original source ID (e.g. Flickr photo ID). Generic for future batch imports. */
    sourceId: text("source_id").notNull(),
    /** Source system: "flickr", future: "lightroom", etc. */
    source: text("source").notNull().default("flickr"),
    /** Public R2 URL — https://pub-xxx.r2.dev/photos/{filename}.webp */
    r2Url: text("r2_url").notNull(),
    title: text("title").notNull().default(""),
    description: text("description").notNull().default(""),
    dateTaken: timestamp("date_taken"),
    views: integer("views").notNull().default(0),
    faves: integer("faves").notNull().default(0),
    /** views + faves + comments — used to rank top 500 */
    interestingnessScore: integer("interestingness_score").notNull().default(0),
    /** Stored from Sharp processing for mosaic aspect-ratio layout */
    width: integer("width"),
    height: integer("height"),
    /** At most one photo true — pinned prominently, never shuffled */
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("gallery_photos_source_unique").on(table.source, table.sourceId),
    index("gallery_photos_active_score_idx").on(table.isActive, table.interestingnessScore),
    index("gallery_photos_featured_idx").on(table.isFeatured),
  ]
);

export const galleryPhotosRelations = relations(galleryPhotos, () => ({}));

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
export type NewsItemRow = typeof newsItems.$inferSelect;
export type SiteEventRow = typeof siteEvents.$inferSelect;

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type NewGalleryPhoto = typeof galleryPhotos.$inferInsert;

export type ContentType = "essay" | "about";
export type CollectionItemLinkedType = "video" | "photo";

// ─── Site Settings (key/value store for site-wide config) ───────────────────

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Books ───────────────────────────────────────────────────────────────────

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  publisher: text("publisher").notNull(),
  year: integer("year").notNull(),
  description: text("description").notNull().default(""),
  coverImageUrl: text("cover_image_url"),
  buyUrl: text("buy_url"),
  isbn: text("isbn").notNull().default(""),
  displayOrder: integer("display_order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Literary Publications ───────────────────────────────────────────────────

export const literaryPublications = pgTable("literary_publications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  publication: text("publication").notNull(),
  date: text("date").notNull(),
  kind: text("kind").notNull().default("journal"),
  url: text("url"),
  description: text("description").notNull().default(""),
  displayOrder: integer("display_order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Online Readings (YouTube, TikTok, R2-hosted video appearances) ─────────

export const onlineReadings = pgTable("online_readings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  /** ISO date string YYYY-MM-DD */
  date: text("date").notNull(),
  /** "youtube" | "tiktok" | "r2" */
  platform: text("platform").notNull().default("youtube"),
  /** YouTube / TikTok share URL for embedded or linked playback */
  externalUrl: text("external_url"),
  /** Cloudflare R2 public MP4 URL for self-hosted videos */
  r2Url: text("r2_url"),
  /** Thumbnail image URL — auto-derived for YouTube or manually supplied */
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  description: text("description").notNull().default(""),
  displayOrder: integer("display_order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Inferred Types (literary) ───────────────────────────────────────────────

export type SiteSetting = typeof siteSettings.$inferSelect;
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type LiteraryPublication = typeof literaryPublications.$inferSelect;
export type NewLiteraryPublication = typeof literaryPublications.$inferInsert;
export type OnlineReading = typeof onlineReadings.$inferSelect;
export type NewOnlineReading = typeof onlineReadings.$inferInsert;
