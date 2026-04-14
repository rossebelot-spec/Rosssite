import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
import { SectionHeader } from "@/components/section-header";
import { ReadingPieceShell } from "@/components/reading-piece-shell";

export const metadata: Metadata = {
  title: "Works",
  description: "Commentary and analysis, essays, and literary publications.",
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
    title: "Commentary and Analysis",
    description: "Magazine and policy writing by publication.",
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
    <ReadingPieceShell>
      <main className="work-hub w-full">
        <SectionHeader
          title="Works"
          description="Writing organized by form: commentary and analysis in magazines and policy outlets, general essays, and literary publications such as books and journals."
        />
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="work-hub-card group block p-6"
              >
                <h2 className="font-heading text-xl mb-2 text-foreground group-hover:text-warm-accent transition-colors">
                  {c.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </ReadingPieceShell>
  );
}
