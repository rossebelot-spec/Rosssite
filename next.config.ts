import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
