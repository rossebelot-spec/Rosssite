import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/essays", label: "Essays" },
  { href: "/admin/book-reviews", label: "Book Reviews" },
  { href: "/admin/photography", label: "Photography" },
  { href: "/admin/op-eds", label: "Op-eds" },
  { href: "/admin/press", label: "Press" },
  { href: "/admin/events", label: "Events" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 border-r border-border bg-surface px-4 py-8 hidden md:flex flex-col gap-6">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          Admin
        </p>
        <nav className="flex flex-col gap-4">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Link
            href="/api/auth/signout"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors"
          >
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 px-6 py-8 max-w-screen-lg">{children}</div>
    </div>
  );
}
