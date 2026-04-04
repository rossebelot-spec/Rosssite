import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Essay = typeof essays.$inferSelect;
export type NewEssay = typeof essays.$inferInsert;
export type BookReview = typeof bookReviews.$inferSelect;
export type NewBookReview = typeof bookReviews.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
