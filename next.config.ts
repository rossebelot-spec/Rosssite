import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // ── Old WordPress blog posts → essays ──────────────────────────────────
      // /blog/essay/:slug  (with and without trailing slash)
      { source: "/blog/essay/:slug/", destination: "/essays/:slug", permanent: true },
      { source: "/blog/essay/:slug",  destination: "/essays/:slug", permanent: true },

      // /blog/poetry-review/:slug
      { source: "/blog/poetry-review/:slug/", destination: "/essays/:slug", permanent: true },
      { source: "/blog/poetry-review/:slug",  destination: "/essays/:slug", permanent: true },

      // /blog/personal-story-blog/:slug
      { source: "/blog/personal-story-blog/:slug/", destination: "/essays/:slug", permanent: true },
      { source: "/blog/personal-story-blog/:slug",  destination: "/essays/:slug", permanent: true },

      // ── Specific essay redirects ──────────────────────────────────────────────
      // Touring the Twentieth Century with Campbell McGrath (essay was renamed)
      { source: "/essays/touring-the-twentieth-century-with-campbell-mcgrath/", destination: "/essays/a-review-of-xx-touring-the-twentieth-century-with-campbell-mcgrath", permanent: true },
      { source: "/essays/touring-the-twentieth-century-with-campbell-mcgrath",  destination: "/essays/a-review-of-xx-touring-the-twentieth-century-with-campbell-mcgrath", permanent: true },

      // MTCCH gallery posts → exact poem (must come before the wildcard fallback)
      { source: "/blog/mtcch-gallery/on-leaving-1st-video-gallery-poem/",                              destination: "/video/collections/moving-to-climate-change-hours?poem=on-leaving",                                              permanent: true },
      { source: "/blog/mtcch-gallery/on-leaving-1st-video-gallery-poem",                               destination: "/video/collections/moving-to-climate-change-hours?poem=on-leaving",                                              permanent: true },
      { source: "/blog/mtcch-gallery/black-and-white-image-ekphrastic-poem/",                          destination: "/video/collections/moving-to-climate-change-hours?poem=black-and-white-image",                                   permanent: true },
      { source: "/blog/mtcch-gallery/black-and-white-image-ekphrastic-poem",                           destination: "/video/collections/moving-to-climate-change-hours?poem=black-and-white-image",                                   permanent: true },
      { source: "/blog/mtcch-gallery/marriage-magical-realism-video-3/",                               destination: "/video/collections/moving-to-climate-change-hours?poem=marriage",                                                permanent: true },
      { source: "/blog/mtcch-gallery/marriage-magical-realism-video-3",                                destination: "/video/collections/moving-to-climate-change-hours?poem=marriage",                                                permanent: true },
      { source: "/blog/mtcch-gallery/12-dancers-on-12-tables-poem-4/",                                 destination: "/video/collections/moving-to-climate-change-hours?poem=12-dancers-on-12-tables",                                 permanent: true },
      { source: "/blog/mtcch-gallery/12-dancers-on-12-tables-poem-4",                                  destination: "/video/collections/moving-to-climate-change-hours?poem=12-dancers-on-12-tables",                                 permanent: true },
      { source: "/blog/mtcch-gallery/cormorants-diving-poetics-of-scent-poem-5/",                      destination: "/video/collections/moving-to-climate-change-hours?poem=cormorants-diving-poetics-of-scent",                      permanent: true },
      { source: "/blog/mtcch-gallery/cormorants-diving-poetics-of-scent-poem-5",                       destination: "/video/collections/moving-to-climate-change-hours?poem=cormorants-diving-poetics-of-scent",                      permanent: true },
      { source: "/blog/mtcch-gallery/lac-megantic-the-art-of-revision-poem-6/",                        destination: "/video/collections/moving-to-climate-change-hours?poem=lac-m-gantic",                                           permanent: true },
      { source: "/blog/mtcch-gallery/lac-megantic-the-art-of-revision-poem-6",                         destination: "/video/collections/moving-to-climate-change-hours?poem=lac-m-gantic",                                           permanent: true },
      { source: "/blog/mtcch-gallery/bolted-landscape-wordsworthianism-entropology-third-landcape-poem7/", destination: "/video/collections/moving-to-climate-change-hours?poem=bolted-landscape-wordsworthianism-entropology-third-landscape", permanent: true },
      { source: "/blog/mtcch-gallery/bolted-landscape-wordsworthianism-entropology-third-landcape-poem7",  destination: "/video/collections/moving-to-climate-change-hours?poem=bolted-landscape-wordsworthianism-entropology-third-landscape", permanent: true },
      { source: "/blog/mtcch-gallery/at-a-slough-in-eugene-associative-movement-and-the-surreal-poem-8/",  destination: "/video/collections/moving-to-climate-change-hours?poem=at-a-slough-in-eugene-associative-movement-and-the-surreal", permanent: true },
      { source: "/blog/mtcch-gallery/at-a-slough-in-eugene-associative-movement-and-the-surreal-poem-8",   destination: "/video/collections/moving-to-climate-change-hours?poem=at-a-slough-in-eugene-associative-movement-and-the-surreal", permanent: true },
      { source: "/blog/mtcch-gallery/while-apple-picking-iv-spiralling-poetry/",                       destination: "/video/collections/moving-to-climate-change-hours?poem=while-apple-picking-iv-spiralling-poetry",                permanent: true },
      { source: "/blog/mtcch-gallery/while-apple-picking-iv-spiralling-poetry",                        destination: "/video/collections/moving-to-climate-change-hours?poem=while-apple-picking-iv-spiralling-poetry",                permanent: true },
      { source: "/blog/mtcch-gallery/after-the-movie-intertextuality-and-self-reflexivity/",           destination: "/video/collections/moving-to-climate-change-hours?poem=after-the-movie-intertextuality-and-self-reflexivity",    permanent: true },
      { source: "/blog/mtcch-gallery/after-the-movie-intertextuality-and-self-reflexivity",            destination: "/video/collections/moving-to-climate-change-hours?poem=after-the-movie-intertextuality-and-self-reflexivity",    permanent: true },
      { source: "/blog/mtcch-gallery/first-day-work-poems-and-poetic-truth-video-11/",                 destination: "/video/collections/moving-to-climate-change-hours?poem=first-day-work-poems-and-poetic-truth",                   permanent: true },
      { source: "/blog/mtcch-gallery/first-day-work-poems-and-poetic-truth-video-11",                  destination: "/video/collections/moving-to-climate-change-hours?poem=first-day-work-poems-and-poetic-truth",                   permanent: true },
      { source: "/blog/mtcch-gallery/what-would-i-say-then-the-pantoum-and-ecopoetry/",                destination: "/video/collections/moving-to-climate-change-hours?poem=what-would-i-say-then-the-pantoum-and-ecopoetry",         permanent: true },
      { source: "/blog/mtcch-gallery/what-would-i-say-then-the-pantoum-and-ecopoetry",                 destination: "/video/collections/moving-to-climate-change-hours?poem=what-would-i-say-then-the-pantoum-and-ecopoetry",         permanent: true },

      // MTCCH halfway post and any other unmapped gallery posts → collection root
      { source: "/blog/mtcch-gallery/:slug/", destination: "/video/collections/moving-to-climate-change-hours", permanent: true },
      { source: "/blog/mtcch-gallery/:slug",  destination: "/video/collections/moving-to-climate-change-hours", permanent: true },

      // /blog/:slug (bare blog posts — enjambment, dream, etc.)
      { source: "/blog/:slug/", destination: "/essays/:slug", permanent: true },
      { source: "/blog/:slug",  destination: "/essays/:slug", permanent: true },

      // /uncategorized/:slug (scent video essay)
      { source: "/uncategorized/:slug/", destination: "/essays/:slug", permanent: true },
      { source: "/uncategorized/:slug",  destination: "/essays/:slug", permanent: true },

      // ── WordPress tag pages → essays listing ──────────────────────────────
      { source: "/tag/:slug/", destination: "/essays", permanent: true },
      { source: "/tag/:slug",  destination: "/essays", permanent: true },

      // ── WordPress date archives → essays listing ───────────────────────────
      { source: "/:year(\\d{4})/:month(\\d{2})/", destination: "/essays", permanent: true },
      { source: "/:year(\\d{4})/:month(\\d{2})",  destination: "/essays", permanent: true },
      { source: "/:year(\\d{4})/",                destination: "/essays", permanent: true },
      { source: "/:year(\\d{4})",                 destination: "/essays", permanent: true },

      // ── WordPress blog root → essays ───────────────────────────────────────
      { source: "/blog/",  destination: "/essays", permanent: true },
      { source: "/blog",   destination: "/essays", permanent: true },

      // ── Old WordPress pages ────────────────────────────────────────────────
      { source: "/about-us",    destination: "/about",         permanent: true },
      { source: "/about-us/",   destination: "/about",         permanent: true },
      { source: "/contact-us",  destination: "/about/contact", permanent: true },
      { source: "/contact-us/", destination: "/about/contact", permanent: true },
      { source: "/events",      destination: "/happenings",    permanent: true },
      { source: "/events/",     destination: "/happenings",    permanent: true },
      { source: "/photos",      destination: "/photography/collections/most-interesting", permanent: true },
      { source: "/photos/",     destination: "/photography/collections/most-interesting", permanent: true },
      { source: "/poetry-ii",   destination: "/literary",      permanent: true },
      { source: "/poetry-ii/",  destination: "/literary",      permanent: true },
      { source: "/video-ii",    destination: "/multimedia",    permanent: true },
      { source: "/video-ii/",   destination: "/multimedia",    permanent: true },
      { source: "/mtcch-gallery",  destination: "/video/collections/moving-to-climate-change-hours", permanent: true },
      { source: "/mtcch-gallery/", destination: "/video/collections/moving-to-climate-change-hours", permanent: true },
      { source: "/clients",     destination: "/about",         permanent: true },
      { source: "/clients/",    destination: "/about",         permanent: true },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "www.nationalobserver.com",
      },
      {
        protocol: "https",
        hostname: "*.nationalobserver.com",
      },
      {
        protocol: "https",
        hostname: "macleans.mblycdn.com",
      },
      {
        protocol: "https",
        hostname: "ipolitics.ca",
      },
      {
        // Cloudflare R2 public bucket — gallery photos
        protocol: "https",
        hostname: "pub-efa70c06434341bc8c70873dce8e61ae.r2.dev",
      },
    ],
  },
  // Default Server Action body limit is 1 MB; long essay HTML + metadata exceeds that easily.
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
