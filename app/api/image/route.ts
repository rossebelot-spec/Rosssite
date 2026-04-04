import { NextRequest, NextResponse } from "next/server";

// Proxy for private Vercel Blob images.
// Fetches the blob server-side using BLOB_READ_WRITE_TOKEN, then streams
// the response back to the browser with aggressive caching so Vercel's
// edge CDN handles repeat requests — the blob store is hit only once per
// unique image.
export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get("url");

  if (!blobUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Only proxy requests to our own Vercel Blob store
  let parsed: URL;
  try {
    parsed = new URL(blobUrl);
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) {
    return new NextResponse("URL not allowed", { status: 403 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new NextResponse("Blob token not configured", { status: 500 });
  }

  const upstream = await fetch(blobUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!upstream.ok) {
    return new NextResponse("Blob fetch failed", { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      // Immutable: CDN caches indefinitely; blob URLs are content-addressed
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
