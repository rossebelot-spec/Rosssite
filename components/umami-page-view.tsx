"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type TrackProps = {
  url: string;
  title: string;
  referrer: string;
};

declare global {
  interface Window {
    umami?: {
      track: (
        nameOrProps?:
          | string
          | Partial<TrackProps>
          | ((props: TrackProps) => Partial<TrackProps>),
        data?: Record<string, unknown>,
      ) => void;
    };
  }
}

export function UmamiPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const qs = searchParams?.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;

    // Wait for Next.js to commit the new <title> and for the tracker to
    // finish loading (defer + poll), then fire a single explicit pageview.
    let attempts = 0;
    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const send = () => {
      if (!window.umami) {
        if (attempts++ < 40) {
          timerId = setTimeout(send, 50); // up to ~2s while the script loads
        }
        return;
      }
      window.umami.track((props) => ({
        ...props,
        url,
        title: document.title,
      }));
    };

    // One animation frame lets Next commit metadata before we read document.title.
    rafId = requestAnimationFrame(send);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
    };
  }, [pathname, searchParams]);

  return null;
}
