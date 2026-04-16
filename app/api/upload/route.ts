import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireApiSession } from "@/lib/api-auth";

/** Raster images only — no SVG (active content) uploads. */
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export async function POST(req: NextRequest) {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const type = file.type.toLowerCase();
  if (type === "image/svg+xml") {
    return NextResponse.json(
      { error: "SVG uploads are not allowed" },
      { status: 400 }
    );
  }

  if (!ALLOWED_IMAGE_TYPES.has(type)) {
    return NextResponse.json(
      {
        error:
          "Allowed types: JPEG, PNG, WebP, GIF, or HEIC. Ensure the file reports a correct image/* Content-Type.",
      },
      { status: 400 }
    );
  }

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}
