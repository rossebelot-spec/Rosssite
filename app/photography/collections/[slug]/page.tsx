import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { collections, galleryPhotos } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { GalleryMosaic } from "@/components/gallery/gallery-mosaic";
import { SectionHeader } from "@/components/section-header";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCollectionWithPhotos(slug: string) {
  const db = getDb();
  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.published, true)));

  if (!collection || collection.mediaType !== "photo") return null;

  const photos = await db
    .select()
    .from(galleryPhotos)
    .where(eq(galleryPhotos.isActive, true))
    .orderBy(desc(galleryPhotos.interestingnessScore));

  const featuredPhoto = photos.find((p) => p.isFeatured) ?? null;
  const activePhotos = photos;

  return { collection, photos: activePhotos, featuredPhoto };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollectionWithPhotos(slug);
  if (!result) return {};
  const { collection } = result;

  const path = `/photography/collections/${slug}`;
  const desc = collection.description?.trim() || undefined;

  return {
    title: collection.title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: collection.title,
      description: desc,
      url: absoluteUrl(path),
      locale: "en_CA",
      siteName: "Ross Belot",
      ...(collection.coverImageUrl && { images: [{ url: collection.coverImageUrl }] }),
    },
    twitter: {
      card: collection.coverImageUrl ? "summary_large_image" : "summary",
      title: collection.title,
      description: desc,
      ...(collection.coverImageUrl && { images: [collection.coverImageUrl] }),
    },
  };
}

export default async function PhotoCollectionPage({ params }: Props) {
  const { slug } = await params;
  const result = await getCollectionWithPhotos(slug);
  if (!result) notFound();

  const { collection, photos, featuredPhoto } = result;

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader
        title={collection.title}
        description={collection.description || undefined}
      />
      <GalleryMosaic photos={photos} featuredPhoto={featuredPhoto} />
    </main>
  );
}
