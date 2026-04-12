import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/db";
import { collections } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = { title: "Video" };
export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const db = getDb();
  const published = await db
    .select()
    .from(collections)
    .where(eq(collections.published, true))
    .orderBy(asc(collections.displayOrder));

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader title="Video" />
      {published.length === 0 ? (
        <p className="text-muted-foreground text-sm">No collections yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {published.map((coll) => (
            <Link
              key={coll.id}
              href={`/video/collections/${coll.slug}`}
              className="group flex flex-col gap-3"
            >
              {coll.coverImageUrl ? (
                <div className="relative aspect-video bg-surface overflow-hidden rounded">
                  <Image
                    src={coll.coverImageUrl}
                    alt={coll.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-surface rounded flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">
                    No cover
                  </span>
                </div>
              )}
              <div>
                <p className="font-heading text-lg group-hover:text-warm-accent transition-colors">
                  {coll.title}
                </p>
                {coll.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {coll.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
