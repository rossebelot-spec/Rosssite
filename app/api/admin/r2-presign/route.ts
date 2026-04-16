import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireApiSession } from "@/lib/api-auth";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "87e1212f0dca896abd2b40062520b511";
const R2_BUCKET = process.env.R2_BUCKET ?? "videos";
const R2_PUBLIC_BASE =
  process.env.R2_PUBLIC_BASE ??
  "https://pub-d8957166d20c44e78b0fef5b4d25a13d.r2.dev";

function getR2Client() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set in .env.local"
    );
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiSession();
  if ("response" in authResult) return authResult.response;

  let filename: string;
  let contentType: string;

  try {
    const body = await req.json() as { filename?: string; contentType?: string };
    filename = (body.filename ?? "").trim();
    contentType = (body.contentType ?? "video/mp4").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  // Sanitise the key — strip leading slashes, collapse path separators
  const key = filename.replace(/^\/+/, "").replace(/\/+/g, "/");
  const publicUrl = `${R2_PUBLIC_BASE.replace(/\/$/, "")}/${key}`;

  let presignedUrl: string;
  try {
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    // Valid for 15 minutes — plenty for a browser upload
    presignedUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate presigned URL";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ presignedUrl, publicUrl, key });
}
