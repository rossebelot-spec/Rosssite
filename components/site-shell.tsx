import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SITE_HEADER_HEIGHT_BOOTSTRAP } from "@/lib/site-header-height-bootstrap";

/** Server Component so the bootstrap `<script>` is real HTML (runs at parse time). In a Client Component, React will not execute this script (React 19). */
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
