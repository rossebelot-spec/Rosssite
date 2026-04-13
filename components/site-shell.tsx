"use client";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SITE_HEADER_HEIGHT_BOOTSTRAP } from "@/lib/site-header-height-bootstrap";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <script
        dangerouslySetInnerHTML={{ __html: SITE_HEADER_HEIGHT_BOOTSTRAP }}
      />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
