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

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-heading text-xl tracking-widest uppercase text-foreground hover:text-warm-accent transition-colors"
        >
          Ross Belot
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs tracking-widest uppercase transition-colors ${
                pathname.startsWith(link.href)
                  ? "text-warm-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <button
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open menu"
              />
            }
          >
            <Menu size={20} />
          </SheetTrigger>
          <SheetContent side="right" className="bg-surface border-border w-64">
            <nav className="flex flex-col gap-6 mt-10">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`text-xs tracking-widest uppercase transition-colors ${
                    pathname.startsWith(link.href)
                      ? "text-warm-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
