import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { absoluteUrl } from "@/lib/seo";
import { SectionHeader } from "@/components/section-header";

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

type WorkHubCard = {
  href: string;
  title: string;
  description: string;
  /** Optional cover; add under `public/` when ready. */
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  placeholderLabel: string;
};

const cards: WorkHubCard[] = [
  {
    href: "/op-eds",
    title: "Commentary and Analysis",
    description: "Magazine and policy writing by publication.",
    placeholderLabel: "Op-eds",
  },
  {
    href: "/essays",
    title: "Essays",
    description: "Long-form essays and blog posts.",
    placeholderLabel: "Essays",
  },
  {
    href: "/literary",
    title: "Literary",
    description: "Books, journals, and formally published work.",
    placeholderLabel: "Literary",
  },
];

export default function WorkHubPage() {
  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader
        title="Works"
        description="Writing organized by form: commentary and analysis in magazines and policy outlets, general essays, and literary publications such as books and journals."
      />
      <ul className="divide-y divide-border">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="group flex gap-6 py-7 hover:bg-surface transition-colors -mx-4 px-4 rounded"
            >
              <div className="shrink-0 w-36 h-24 relative overflow-hidden bg-muted rounded">
                {c.thumbnailSrc ? (
                  <Image
                    src={c.thumbnailSrc}
                    alt={c.thumbnailAlt ?? c.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="144px"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs px-2 text-center font-medium">
                    {c.placeholderLabel}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-xl group-hover:text-warm-accent transition-colors leading-snug">
                  {c.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                  {c.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
