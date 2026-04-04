import type { Metadata } from "next";
import { videos } from "@/data/videos";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = { title: "Video" };

export default function VideoPage() {
  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader title="Video" />
      {videos.length === 0 ? (
        <p className="text-muted-foreground text-sm">No videos yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <figure key={video.embedUrl} className="flex flex-col gap-3">
              <div className="relative aspect-video bg-surface overflow-hidden">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
              <figcaption>
                <p className="font-heading text-lg">{video.title}</p>
                {video.date && (
                  <time className="text-xs tracking-widest uppercase text-muted-foreground">
                    {new Date(video.date).getFullYear()}
                  </time>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
