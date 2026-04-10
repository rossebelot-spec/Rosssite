import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/db";
import { videoPoems } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminVideoPoemsPage() {
  const db = getDb();
  const all = await db
    .select()
    .from(videoPoems)
    .orderBy(desc(videoPoems.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Video Poems</h1>
        <Link
          href="/admin/video-poems/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New Video Poem
        </Link>
      </div>

      {all.length === 0 ? (
        <p className="text-muted-foreground text-sm">No video poems yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {all.map((poem) => (
            <li
              key={poem.id}
              className="py-5 flex items-center gap-4"
            >
              {poem.thumbnailUrl && (
                <div className="relative w-24 shrink-0 aspect-video rounded overflow-hidden bg-surface">
                  <Image
                    src={poem.thumbnailUrl}
                    alt={poem.thumbnailAlt || poem.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/video-poems/${poem.id}`}
                  className="font-heading text-xl hover:text-warm-accent transition-colors"
                >
                  {poem.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {poem.slug}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
