"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { MinimalCollectionChrome } from "@/components/minimal-collection-chrome";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCollectionReader = pathname.startsWith("/video/collections");

  if (isCollectionReader) {
    return (
      <>
        <MinimalCollectionChrome />
        <div className="flex-1">{children}</div>
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
