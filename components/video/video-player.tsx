"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  slug: string;
  context: "standalone" | "collection";
}

export function VideoPlayer({ src, poster, title, slug, context }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasPlayed = useRef(false);
  const milestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Reset tracking state when the src changes (collection switch).
    hasPlayed.current = false;
    milestones.current = new Set();
  }, [src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const track = (event: string, data?: Record<string, unknown>) => {
      window.umami?.track(event, { title, slug, context, ...data });
    };

    const onPlay = () => {
      if (hasPlayed.current) return;
      hasPlayed.current = true;
      track("video:play");
    };

    const onTimeUpdate = () => {
      const { duration, currentTime } = el;
      if (!duration || duration === Infinity) return;
      const pct = (currentTime / duration) * 100;
      for (const milestone of [25, 50, 75]) {
        if (pct >= milestone && !milestones.current.has(milestone)) {
          milestones.current.add(milestone);
          track("video:progress", { milestone });
        }
      }
    };

    const onEnded = () => track("video:complete");

    el.addEventListener("play", onPlay);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
    };
  }, [src, title, slug, context]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      preload="metadata"
      className="absolute inset-0 h-full w-full object-contain"
      poster={poster}
    />
  );
}
