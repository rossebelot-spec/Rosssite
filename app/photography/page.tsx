import type { Metadata } from "next";
import { getDb } from "@/db";
import { photos } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { PhotoGrid } from "@/components/photo-grid";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Photography",
  description: "Photographs by Ross Belot — landscapes, field work, and curated collections.",
  alternates: { canonical: "/photography" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Ross Belot",
    title: "Photography | Ross Belot",
    description: "Photographs by Ross Belot — landscapes, field work, and curated collections.",
    url: "https://rossbelot.com/photography",
  },
  twitter: {
    card: "summary",
    title: "Photography | Ross Belot",
    description: "Photographs by Ross Belot — landscapes, field work, and curated collections.",
  },
};
export const dynamic = "force-dynamic";

export default async function PhotographyPage() {
  const db = getDb();
  const allPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.isHero, false))
    .orderBy(asc(photos.displayOrder), asc(photos.createdAt));

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader
        title="Photography"
        description="Gallery images and field work."
      />
      <PhotoGrid photos={allPhotos} />
    </main>
  );
}
