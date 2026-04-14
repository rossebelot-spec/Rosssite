import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Works",
  description: "Op-eds, essays, and literary publications.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Works | Ross Belot",
    url: absoluteUrl("/work"),
    locale: "en_CA",
    siteName: "Ross Belot",
  },
};

const cards = [
  {
    href: "/op-eds",
    title: "Op-eds",
    description: "Commentary and columns by publication.",
  },
  {
    href: "/essays",
    title: "Essays",
    description: "Long-form essays and blog posts.",
  },
  {
    href: "/literary",
    title: "Literary",
    description: "Books, journals, and formally published work.",
  },
] as const;

export default function WorkHubPage() {
  return (
    <main className="mx-auto w-full max-w-screen-lg px-6 py-16">
      <h1 className="font-heading text-4xl mb-4 text-foreground">Works</h1>
      <p className="text-muted-foreground text-sm max-w-prose mb-12">
        Writing organized by form: newspaper and magazine op-eds, general essays, and
        literary publications such as books and journals.
      </p>
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
