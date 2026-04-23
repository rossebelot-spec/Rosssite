import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { siteAuthorName } from "@/components/author-bio";

/** Absolute URL for a path (leading slash). */
export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

const defaultDescription =
  "Poet, journalist, and environmental writer. Essays, commentary and analysis, photography, and more.";

type ArticleMetaInput = {
  title: string;
  description?: string | null;
  path: string;
  publishedAt?: Date | string | null;
  imageUrl?: string | null;
};

/** Rich metadata for essay / news / review / event article routes. */
export function articleMetadata(input: ArticleMetaInput): Metadata {
  const desc = input.description?.trim() || defaultDescription;
  const url = absoluteUrl(input.path);
  const published = input.publishedAt
    ? new Date(input.publishedAt).toISOString()
    : undefined;

  return {
    title: input.title,
    description: desc,
    alternates: { canonical: input.path },
    openGraph: {
      type: "article",
      title: input.title,
      description: desc,
      url,
      locale: "en_CA",
      siteName: "Ross Belot",
      ...(published && { publishedTime: published }),
      ...(input.imageUrl && { images: [{ url: input.imageUrl }] }),
    },
    twitter: {
      card: input.imageUrl ? "summary_large_image" : "summary",
      title: input.title,
      description: desc,
      ...(input.imageUrl && { images: [input.imageUrl] }),
    },
  };
}

type VideoMetaInput = {
  title: string;
  description: string;
  path: string;
  thumbnailUrl?: string | null;
};

export function videoPageMetadata(input: VideoMetaInput): Metadata {
  const desc = input.description?.trim() || defaultDescription;
  const url = absoluteUrl(input.path);
  const thumb = input.thumbnailUrl?.trim();

  return {
    title: input.title,
    description: desc,
    alternates: { canonical: input.path },
    openGraph: {
      type: "video.other",
      title: input.title,
      description: desc,
      url,
      locale: "en_CA",
      siteName: "Ross Belot",
      ...(thumb && { images: [{ url: thumb }] }),
    },
    twitter: {
      card: thumb ? "summary_large_image" : "summary",
      title: input.title,
      description: desc,
      ...(thumb && { images: [thumb] }),
    },
  };
}

export function articleJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  publishedAt?: Date | string | null;
}) {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    ...(input.description?.trim() && { description: input.description.trim() }),
    ...(input.publishedAt && {
      datePublished: new Date(input.publishedAt).toISOString(),
    }),
    author: {
      "@type": "Person",
      name: siteAuthorName,
    },
    publisher: {
      "@type": "Person",
      name: siteAuthorName,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export function newsArticleJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  publishedAt?: Date | string | null;
}) {
  const url = absoluteUrl(input.path);
  const publishedDate = input.publishedAt ? new Date(input.publishedAt).toISOString() : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.title,
    ...(input.description?.trim() && { description: input.description.trim() }),
    ...(publishedDate && {
      datePublished: publishedDate,
      dateModified: publishedDate,
    }),
    author: {
      "@type": "Person",
      name: siteAuthorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Ross Belot",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/android-chrome-192x192.png"),
        width: 192,
        height: 192,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export function websiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ross Belot",
    url,
    description: defaultDescription,
    inLanguage: "en-CA",
    publisher: {
      "@type": "Person",
      name: siteAuthorName,
      url,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function videoObjectJsonLd(input: {
  name: string;
  description: string;
  path: string;
  thumbnailUrl?: string | null;
  publishedAt?: Date | string | null;
  durationSeconds?: number | null;
  contentUrl?: string | null;
}) {
  const url = absoluteUrl(input.path);

  // Convert seconds to ISO 8601 duration format (e.g., "PT5M30S")
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let duration = "PT";
    if (hours > 0) duration += `${hours}H`;
    if (minutes > 0) duration += `${minutes}M`;
    if (secs > 0) duration += `${secs}S`;

    return duration || "PT0S";
  };

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: input.name,
    description: input.description || defaultDescription,
    ...(input.thumbnailUrl?.trim() && { thumbnailUrl: input.thumbnailUrl.trim() }),
    ...(input.publishedAt && {
      uploadDate: new Date(input.publishedAt).toISOString(),
    }),
    ...(input.durationSeconds && { duration: formatDuration(input.durationSeconds) }),
    ...(input.contentUrl?.trim() && { contentUrl: input.contentUrl.trim() }),
    url,
  };
}
