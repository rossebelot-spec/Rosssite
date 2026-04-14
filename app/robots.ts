import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Until `NEXT_PUBLIC_SITE_LIVE=true`, the site is treated as pre-launch and
 * search engines are asked not to index (staging / preview).
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  const live = process.env.NEXT_PUBLIC_SITE_LIVE === "true";
  if (!live) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
