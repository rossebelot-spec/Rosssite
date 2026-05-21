import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Production deployments are always indexable. Vercel preview and development
 * deployments are blocked from search engines automatically via `VERCEL_ENV`,
 * so there is no launch flag to set or forget.
 *
 * Escape hatch: set `NEXT_PUBLIC_SITE_LIVE=false` to force-block production.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  const forceBlocked = process.env.NEXT_PUBLIC_SITE_LIVE === "false";
  const live = !forceBlocked && process.env.VERCEL_ENV === "production";
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
