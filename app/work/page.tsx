import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { absoluteUrl } from "@/lib/seo";
import { SectionHeader } from "@/components/section-header";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Works",
  description: "Commentary and analysis, essays, and literary publications.",
  alternates: { canonical: "/work" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Ross Belot",
    title: "Works | Ross Belot",
    description: "Commentary and analysis, essays, and literary publications.",
    url: absoluteUrl("/work"),
  },
  twitter: {
    card: "summary",
    title: "Works | Ross Belot",
    description: "Commentary and analysis, essays, and literary publications.",
  },
};

const HUB_KEYS = [
  "works_hub_commentary_thumbnail",
  "works_hub_essays_thumbnail",
  "works_hub_literary_thumbnail",
] as const;

type HubKey = (typeof HUB_KEYS)[number];

export default async function WorkHubPage() {
  // Fetch thumbnail URLs from site_settings
  const db = getDb();
  const settingRows = await db
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, [...HUB_KEYS]));

  const thumbs: Record<HubKey, string | null> = {
    works_hub_commentary_thumbnail: null,
    works_hub_essays_thumbnail: null,
    works_hub_literary_thumbnail: null,
  };
  for (const row of settingRows) {
    if (row.key in thumbs) {
      thumbs[row.key as HubKey] = row.value ?? null;
    }
  }

  const cards = [
    {
      href: "/op-eds",
      title: "Commentary and Analysis",
      description: "Magazine and policy writing by publication.",
      placeholderLabel: "Op-eds",
      thumbnailSrc: thumbs.works_hub_commentary_thumbnail,
    },
    {
      href: "/essays",
      title: "Essays",
      description: "Long-form essays.",
      placeholderLabel: "Essays",
      thumbnailSrc: thumbs.works_hub_essays_thumbnail,
    },
    {
      href: "/literary",
      title: "Literary",
      description: "Books, journals, and formally published work.",
      placeholderLabel: "Literary",
      thumbnailSrc: thumbs.works_hub_literary_thumbnail,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader
        title="Works"
        description="Writing organized by form: commentary and analysis in magazines and policy outlets, general essays, and literary publications such as books and journals."
      />
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="group block" onClick={() => window.umami?.track({ event: 'works_hub_click', label: c.title })}>
              <div className="relative w-full aspect-video bg-muted rounded overflow-hidden mb-4">
                {c.thumbnailSrc ? (
                  <Image
                    src={c.thumbnailSrc}
                    alt={c.title}
                    fill
                    className="object-contain transition-transform group-hover:scale-105"
                    sizes="(min-width: 640px) 33vw, 100vw"
                    /* All three hub tiles are above the fold on sm+; any can be LCP (e.g. book cover). */
                    priority
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm font-medium">
                    {c.placeholderLabel}
                  </span>
                )}
              </div>
              <h2 className="font-heading text-xl group-hover:text-warm-accent transition-colors leading-snug">
                {c.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {c.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
