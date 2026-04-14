import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
