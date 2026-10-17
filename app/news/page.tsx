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

// Static — regenerated on publish via server-action revalidatePath.
// 1 year, not `false`: Vercel sends browsers max-age=14400 for never-expiring prerenders.
export const revalidate = 31536000;

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
