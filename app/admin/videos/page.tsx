import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/db";
import { videos } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  const db = getDb();
  const all = await db.select().from(videos).orderBy(desc(videos.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Videos</h1>
        <Link
          href="/admin/videos/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New Video
        </Link>
      </div>

      {all.length === 0 ? (
        <p className="text-muted-foreground text-sm">No videos yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {all.map((video) => (
            <li key={video.id} className="py-5 flex items-center gap-4">
              {video.thumbnailUrl && (
                <div className="relative w-24 shrink-0 aspect-video rounded overflow-hidden bg-surface">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.thumbnailAlt || video.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/videos/${video.id}`}
                    className="font-heading text-xl hover:text-warm-accent transition-colors"
                  >
                    {video.title}
                  </Link>
                  {!video.published && (
                    <span className="text-xs tracking-widest uppercase px-2 py-0.5 border border-muted-foreground text-muted-foreground shrink-0">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {video.slug}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
