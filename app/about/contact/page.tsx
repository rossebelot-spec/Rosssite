import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Ross Belot.",
  alternates: { canonical: "/about/contact" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Ross Belot",
    title: "Contact | Ross Belot",
    description: "Contact Ross Belot.",
    url: absoluteUrl("/about/contact"),
  },
  twitter: {
    card: "summary",
    title: "Contact | Ross Belot",
    description: "Contact Ross Belot.",
  },
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <div className="mb-8">
        <Link
          href="/about"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          ← About
        </Link>
      </div>
      <SectionHeader title="Contact" />
      <p className="text-muted-foreground text-sm leading-relaxed max-w-prose">
        For inquiries about writing, readings, or rights, you can reach Ross by email at{" "}
        <a
          href="mailto:ross@rossbelot.com"
          className="text-warm-accent hover:text-foreground underline underline-offset-4"
        >
          ross@rossbelot.com
        </a>
        .
      </p>
    </main>
  );
}
