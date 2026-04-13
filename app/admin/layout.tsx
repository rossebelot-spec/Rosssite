import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/photography", label: "Photography" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/op-eds", label: "Op-eds" },
  { href: "/admin/op-ed-collections", label: "Op-ed Collections" },
  { href: "/admin/press", label: "Press" },
  { href: "/admin/events", label: "Events" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth check — middleware handles the primary redirect,
  // but this catches any edge cases that slip through.
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=%2Fadmin");
  }

  return (
    <div className="dark flex min-h-full bg-background text-foreground">
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
          {/* Sign-out requires a POST — cannot use a plain <Link> */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 px-6 py-8 max-w-screen-lg">{children}</div>
    </div>
  );
}
