"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

const links = [
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

  const navLinkClass = (href: string) =>
    `nav-link text-xs tracking-widest uppercase transition-colors ${
      pathname.startsWith(href) ? "nav-link--active" : ""
    }`;

  const allLinks = [...links, { href: "/admin", label: "Admin" }];

  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "fixed top-0 left-0 right-0 z-50 bg-transparent"
          : "sticky top-0 z-50 border-b border-border bg-surface"
      }
    >
      <div className="mx-auto flex max-w-screen-xl items-center px-6 py-4">
        {/* Desktop: links from the left; mobile: hamburger on the right */}
        <nav className="hidden md:flex items-center gap-8">
          {allLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <button
                  className="nav-menu-trigger transition-colors"
                  aria-label="Open menu"
                />
              }
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
    </header>
  );
}
