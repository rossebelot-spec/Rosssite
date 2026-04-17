import type { Metadata } from "next";
import { SectionHeader } from "@/components/section-header";
import { NewsIndexList } from "@/components/happenings/news-index-list";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "News",
  description: "Coverage, announcements, and updates.",
  alternates: { canonical: "/news" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Ross Belot",
    title: "News | Ross Belot",
    description: "Coverage, announcements, and updates.",
    url: absoluteUrl("/news"),
  },
  twitter: {
    card: "summary",
    title: "News | Ross Belot",
    description: "Coverage, announcements, and updates.",
  },
};

export const dynamic = "force-dynamic";

export default async function NewsIndexPage() {
  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader
        title="News"
        description="Coverage, announcements, and updates."
      />
      <NewsIndexList />
    </main>
  );
}
