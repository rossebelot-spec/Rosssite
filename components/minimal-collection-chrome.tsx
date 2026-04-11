"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavContext } from "@/components/nav-context";

export function MinimalCollectionChrome() {
  const { contextLine } = useNavContext();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${el.offsetHeight}px`,
      );
    };
    setHeight();
    const ro = new ResizeObserver(setHeight);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [contextLine]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-border bg-surface"
    >
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="nav-link text-xs tracking-widest uppercase transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} aria-hidden />
          Home
        </Link>
        {contextLine ? (
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            {contextLine}
          </p>
        ) : null}
      </div>
    </header>
  );
}
