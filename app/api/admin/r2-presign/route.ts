import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireApiSession } from "@/lib/api-auth";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "87e1212f0dca896abd2b40062520b511";

const BUCKET_CONFIG: Record<string, { bucket: string; publicBase: string }> = {
  videos: {
    bucket: process.env.R2_BUCKET ?? "videos",
    publicBase:
      process.env.R2_PUBLIC_BASE ??
      "https://pub-d8957166d20c44e78b0fef5b4d25a13d.r2.dev",
  },
  photos: {
    bucket: process.env.R2_PHOTOS_BUCKET ?? "photos",
    publicBase:
      process.env.R2_PHOTOS_PUBLIC_BASE ??
      "https://pub-efa70c06434341bc8c70873dce8e61ae.r2.dev",
  },
};

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
  let bucketKey: string;

  try {
    const body = await req.json() as {
      filename?: string;
      contentType?: string;
      bucket?: string;
    };
    filename = (body.filename ?? "").trim();
    contentType = (body.contentType ?? "video/mp4").trim();
    bucketKey = (body.bucket ?? "videos").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  const config = BUCKET_CONFIG[bucketKey];
  if (!config) {
    return NextResponse.json(
      { error: `Unknown bucket "${bucketKey}". Use "videos" or "photos".` },
      { status: 400 }
    );
  }

  const key = filename.replace(/^\/+/, "").replace(/\/+/g, "/");
  const publicUrl = `${config.publicBase.replace(/\/$/, "")}/${key}`;

  let presignedUrl: string;
  try {
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
    });
    presignedUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate presigned URL";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ presignedUrl, publicUrl, key });
}
