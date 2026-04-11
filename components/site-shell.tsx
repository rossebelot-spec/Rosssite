"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { MinimalCollectionChrome } from "@/components/minimal-collection-chrome";
import { cn } from "@/lib/utils";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCollectionReader = pathname.startsWith("/video/collections");
  const [menuOpen, setMenuOpen] = useState(false);

  if (isCollectionReader) {
    return (
      <>
        <MinimalCollectionChrome
          menuOpen={menuOpen}
          onMenuOpenChange={setMenuOpen}
        />
        <div
          className={cn("flex-1", menuOpen && "pointer-events-none")}
          inert={menuOpen ? true : undefined}
        >
          {children}
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
