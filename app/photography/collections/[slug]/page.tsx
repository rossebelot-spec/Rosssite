import type { Metadata } from "next";
import { randomInt } from "node:crypto";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { collections, galleryPhotos, collectionItems, photos } from "@/db/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { GalleryMosaic } from "@/components/gallery/gallery-mosaic";
import { CuratedPhotoGrid } from "@/components/photography/curated-photo-grid";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCollectionData(slug: string) {
  const db = getDb();
  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.published, true)));

  if (!collection || collection.mediaType !== "photo") return null;

  // Check if this collection has curated blob photos (collectionItems with linkedType: "photo")
  const curatedItems = await db
    .select({
      photoId: collectionItems.linkedId,
      position: collectionItems.position,
    })
    .from(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, collection.id),
        eq(collectionItems.linkedType, "photo")
      )
    )
    .orderBy(asc(collectionItems.position));

  if (curatedItems.length > 0) {
    // Curated blob collection — fetch all photo rows, then sort by collection position
    const allPhotoIds = curatedItems.map((i) => i.photoId);
    const photoRows = await db
      .select()
      .from(photos)
      .where(inArray(photos.id, allPhotoIds));

    // Re-sort by the position from collectionItems (DB order not guaranteed)
    const positionMap = new Map(curatedItems.map((i) => [i.photoId, i.position]));
    const orderedPhotos = photoRows
      .slice()
      .sort((a, b) => (positionMap.get(a.id) ?? 0) - (positionMap.get(b.id) ?? 0));

    return { collection, type: "curated" as const, curatedPhotos: orderedPhotos };
  }

  // No curated items — fall back to the R2/Flickr mosaic
  const galleryPhotoRows = await db
    .select()
    .from(galleryPhotos)
    .where(eq(galleryPhotos.isActive, true))
    .orderBy(desc(galleryPhotos.interestingnessScore));

  const featuredPhoto = galleryPhotoRows.find((p) => p.isFeatured) ?? null;

  return { collection, type: "mosaic" as const, mosaicPhotos: galleryPhotoRows, featuredPhoto };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollectionData(slug);
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
  const result = await getCollectionData(slug);
  if (!result) notFound();

  const { collection } = result;

  if (result.type === "curated") {
    return (
      <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
        <CuratedPhotoGrid
          photos={result.curatedPhotos}
          collectionTitle={collection.title}
          collectionDescription={collection.description || undefined}
        />
      </main>
    );
  }

  // Mosaic (R2/Flickr archive)
  const shuffleSalt = randomInt(0, 0x80000000);
  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <GalleryMosaic
        photos={result.mosaicPhotos}
        featuredPhoto={result.featuredPhoto}
        shuffleSalt={shuffleSalt}
        collectionTitle={collection.title}
        collectionDescription={collection.description || undefined}
      />
    </main>
  );
}
