import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

const adminGroups: { label: string | null; links: { href: string; label: string }[] }[] = [
  {
    label: null,
    links: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Multimedia",
    links: [
      { href: "/admin/videos", label: "Videos" },
      { href: "/admin/collections", label: "Collections" },
    ],
  },
  {
    label: "Works",
    links: [
      { href: "/admin/content", label: "Essays & Blog" },
      { href: "/admin/op-eds", label: "Op-eds" },
      { href: "/admin/books", label: "Books" },
      { href: "/admin/literary-publications", label: "Publications" },
    ],
  },
  {
    label: "Photography",
    links: [
      { href: "/admin/photography", label: "Photo Uploads" },
      { href: "/admin/gallery", label: "Gallery" },
    ],
  },
  {
    label: "Happenings",
    links: [
      { href: "/admin/news", label: "News" },
      { href: "/admin/events", label: "Events" },
      { href: "/admin/online-readings", label: "Online Readings" },
    ],
  },
  {
    label: "About",
    links: [{ href: "/admin/content?type=about", label: "About Page" }],
  },
  {
    label: "Settings",
    links: [{ href: "/admin/settings/works-hub", label: "Works Hub" }],
  },
];

const utilityLinks = [{ href: "/admin/video-compress", label: "Video Compress" }];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth — `proxy.ts` gates `/admin/*`; this catches edge cases.
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=%2Fadmin");
  }

  return (
    <div
      className="flex min-h-full text-foreground"
      style={{ backgroundColor: "var(--color-reading-bg)" }}
    >
      {/* Sidebar */}
      <aside
        className="w-52 shrink-0 border-r border-stone-200 px-5 py-8 hidden md:flex flex-col gap-6"
        style={{ backgroundColor: "var(--color-folio-paper)" }}
      >
        <nav className="flex flex-col gap-5">
          {adminGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-2">
              {group.label && (
                <p className="text-[10px] tracking-widest uppercase text-stone-400 pt-3 border-t border-stone-200">
                  {group.label}
                </p>
              )}
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-stone-200 pt-4">
          {utilityLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {/* Sign-out requires a POST — cannot use a plain <Link> */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-xs tracking-widest uppercase text-stone-500 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 px-8 py-8 max-w-screen-lg">{children}</div>
    </div>
  );
}
