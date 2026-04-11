"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef } from "react";
import { useNavContext } from "@/components/nav-context";
import { siteNavLinksWithAdmin } from "@/lib/site-nav-links";
import { cn } from "@/lib/utils";

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

type MinimalCollectionChromeProps = {
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
};

export function MinimalCollectionChrome({
  menuOpen,
  onMenuOpenChange,
}: MinimalCollectionChromeProps) {
  const pathname = usePathname();
  const { contextLine } = useNavContext();
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = useCallback(
    () => onMenuOpenChange(false),
    [onMenuOpenChange],
  );
  const toggle = useCallback(
    () => onMenuOpenChange(!menuOpen),
    [menuOpen, onMenuOpenChange],
  );

  const isNavActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const button = menuButtonRef.current;
      const panel = panelRef.current;
      if (!panel || !button) return;

      const inPanel = getFocusable(panel);
      const focusables = [...inPanel, button];
      if (focusables.length === 0) return;

      const i = focusables.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;

      if (e.shiftKey) {
        if (i === 0) {
          e.preventDefault();
          focusables[focusables.length - 1]?.focus();
        }
      } else {
        if (i === focusables.length - 1) {
          e.preventDefault();
          focusables[0]?.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const first = panel ? getFocusable(panel)[0] : null;
    requestAnimationFrame(() => first?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen, close]);

  useEffect(() => {
    if (!menuOpen) {
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }, [menuOpen]);

  return (
    <>
      {/* Title bar — height drives --site-header-height */}
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-border bg-surface pr-24 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 pl-6 md:pl-6"
      >
        <div className="mx-auto max-w-screen-xl">
          {contextLine ? (
            <p className="text-xs tracking-widest uppercase text-muted-foreground text-balance">
              {contextLine}
            </p>
          ) : null}
        </div>
      </header>

      {/* Menu control above overlay when open */}
      <div
        className={cn(
          "fixed top-0 right-0 flex justify-end p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))]",
          menuOpen ? "z-[110]" : "z-50",
        )}
      >
        <button
          ref={menuButtonRef}
          type="button"
          className={cn(
            "font-sans text-xs tracking-widest uppercase",
            "text-muted-foreground transition-colors duration-150 hover:text-foreground",
            "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-foreground/40",
          )}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? panelId : undefined}
          aria-haspopup="dialog"
          onClick={toggle}
        >
          Menu
        </button>
      </div>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-[100] transition-opacity duration-150 ease-out"
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-background/85"
            aria-hidden
            onMouseDown={close}
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            tabIndex={-1}
            className="absolute left-0 top-0 flex h-full max-h-full w-full max-w-sm flex-col overflow-y-auto px-8 pb-12 pt-[max(5.5rem,env(safe-area-inset-top))] pl-[max(2rem,env(safe-area-inset-left))] pr-[max(2rem,env(safe-area-inset-right))]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <nav aria-label="Site" className="flex flex-col gap-5">
              {siteNavLinksWithAdmin.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "font-sans text-xs tracking-widest uppercase transition-colors duration-150",
                    isNavActive(link.href)
                      ? "text-warm-accent"
                      : "text-foreground hover:text-muted-foreground",
                  )}
                  onClick={close}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
