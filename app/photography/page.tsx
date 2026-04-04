import type { Metadata } from "next";
import { getDb } from "@/db";
import { photos } from "@/db/schema";
import { asc } from "drizzle-orm";
import { PhotoGrid } from "@/components/photo-grid";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = { title: "Photography" };
export const dynamic = "force-dynamic";

export default async function PhotographyPage() {
  const db = getDb();
  const allPhotos = await db
    .select()
    .from(photos)
    .orderBy(asc(photos.displayOrder), asc(photos.createdAt));

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader title="Photography" />
      <PhotoGrid photos={allPhotos} />
    </main>
  );
}
