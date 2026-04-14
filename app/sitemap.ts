import type { MetadataRoute } from "next";
import { getDb } from "@/db";
import { content, videos, collections, opEdCollections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

/** Regenerate sitemap periodically; content changes also propagate on deploy. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const db = getDb();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/essays`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/book-reviews`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/news`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/op-eds`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/video`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/photography`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/press`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/events`, changeFrequency: "weekly", priority: 0.75 },
  ];

  const [contentRows, videoRows, collectionRows, opEdCollectionRows] = await Promise.all([
    db
      .select({
        slug: content.slug,
        type: content.type,
        updatedAt: content.updatedAt,
      })
      .from(content)
      .where(eq(content.published, true)),
    db
      .select({ slug: videos.slug, updatedAt: videos.updatedAt })
      .from(videos)
      .where(eq(videos.published, true)),
    db
      .select({ slug: collections.slug, updatedAt: collections.updatedAt })
      .from(collections)
      .where(eq(collections.published, true)),
    db
      .select({ slug: opEdCollections.slug, updatedAt: opEdCollections.updatedAt })
      .from(opEdCollections),
  ]);

  const fromContent: MetadataRoute.Sitemap = [];

  for (const row of contentRows) {
    const lm = row.updatedAt ?? new Date();
    switch (row.type) {
      case "essay":
      case "blog":
        fromContent.push({
          url: `${base}/essays/${row.slug}`,
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.8,
        });
        break;
      case "review":
        fromContent.push({
          url: `${base}/book-reviews/${row.slug}`,
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.75,
        });
        break;
      case "news":
        fromContent.push({
          url: `${base}/news/${row.slug}`,
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.75,
        });
        break;
      case "event":
        fromContent.push({
          url: `${base}/events/${row.slug}`,
          lastModified: lm,
          changeFrequency: "monthly",
          priority: 0.7,
        });
        break;
      case "about":
        // Canonical listing page is /about, not /about/from-slug
        break;
      default:
        break;
    }
  }

  const fromVideos: MetadataRoute.Sitemap = videoRows.map((v) => ({
    url: `${base}/video/${v.slug}`,
    lastModified: v.updatedAt ?? new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const fromCollections: MetadataRoute.Sitemap = collectionRows.map((c) => ({
    url: `${base}/video/collections/${c.slug}`,
    lastModified: c.updatedAt ?? new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const fromOpEdCols: MetadataRoute.Sitemap = opEdCollectionRows.map((c) => ({
    url: `${base}/op-eds/${c.slug}`,
    lastModified: c.updatedAt ?? new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...fromContent, ...fromVideos, ...fromCollections, ...fromOpEdCols];
}
