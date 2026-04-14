import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "About",
  description: "Bio, events, and contact.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Ross Belot",
    description: "Bio, events, and contact.",
    url: absoluteUrl("/about"),
    locale: "en_CA",
    siteName: "Ross Belot",
  },
};

const cards = [
  {
    href: "/about/bio",
    title: "Bio",
    description: "Background, portrait, and editorial introduction.",
  },
  {
    href: "/about/events",
    title: "Events",
    description: "Readings, launches, and appearances.",
  },
  {
    href: "/about/contact",
    title: "Contact",
    description: "Get in touch.",
  },
] as const;

export default function AboutHubPage() {
  return (
    <main className="mx-auto w-full max-w-screen-lg px-6 py-16">
      <SectionHeader
        title="About"
        description="Biography, upcoming and past events, and how to reach Ross."
      />
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="group block rounded-lg border border-border bg-surface p-6 transition-colors hover:border-warm-accent"
            >
              <h2 className="font-heading text-xl mb-2 group-hover:text-warm-accent transition-colors">
                {c.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
