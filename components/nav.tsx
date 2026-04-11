"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavContext } from "@/components/nav-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/essays", label: "Essays" },
  { href: "/op-eds", label: "Op-eds" },
  { href: "/book-reviews", label: "Books" },
  { href: "/photography", label: "Photography" },
  { href: "/video", label: "Video" },
  { href: "/press", label: "Press" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { contextLine } = useNavContext();
  const headerRef = useRef<HTMLElement>(null);

  const isNavActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navLinkClass = (href: string) =>
    `nav-link text-xs tracking-widest uppercase transition-colors ${
      isNavActive(href) ? "nav-link--active" : ""
    }`;

  const allLinks = [...links, { href: "/admin", label: "Admin" }];

  const isHome = pathname === "/";

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${el.offsetHeight}px`
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
      className={
        isHome
          ? "nav-header--hero fixed top-0 left-0 right-0 z-50 bg-transparent"
          : "sticky top-0 z-50 border-b border-border bg-surface"
      }
    >
      <div className="mx-auto flex max-w-screen-xl flex-col gap-2 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className={`nav-site-name font-heading text-sm tracking-[0.2em] uppercase ${
              isHome ? "" : "text-foreground"
            }`}
          >
            Ross Belot
          </Link>
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className="nav-menu-trigger inline-flex items-center justify-center rounded-md p-0.5 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </SheetTrigger>
              <SheetContent side="right" className="bg-surface border-border w-64">
                <nav className="flex flex-col gap-6 mt-10">
                  {allLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={navLinkClass(link.href)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <nav className="hidden md:flex flex-wrap items-center gap-x-8 gap-y-2">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(link.href)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {contextLine ? (
          <p
            className={`nav-context-line text-xs tracking-widest uppercase ${
              isHome ? "" : "text-muted-foreground"
            }`}
          >
            {contextLine}
          </p>
        ) : null}
      </div>
    </header>
  );
}
