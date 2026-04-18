"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    umami?: { track: (props?: Record<string, unknown>) => void };
  }
}

export function UmamiPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    window.umami?.track();
  }, [pathname, searchParams]);

  return null;
}
