import type { Metadata } from "next";
import { SectionHeader } from "@/components/section-header";
import {
  HappeningsTabs,
  type HappeningsTab,
} from "@/components/happenings/happenings-tabs";
import { NewsIndexList } from "@/components/happenings/news-index-list";
import { SiteEventsIndex } from "@/components/happenings/site-events-index";
import { OnlineReadingsIndex } from "@/components/happenings/online-readings-index";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const { tab } = await searchParams;
  const view: HappeningsTab =
    tab === "events" ? "events" : tab === "readings" ? "readings" : "news";
  const desc =
    view === "events"
      ? "Readings, launches, and appearances."
      : view === "readings"
        ? "Online readings and video appearances."
        : "Coverage, announcements, and updates.";
  return {
    title: "Happenings",
    description: desc,
    alternates: { canonical: "/happenings" },
    openGraph: {
      type: "website",
      locale: "en_CA",
      siteName: "Ross Belot",
      title: "Happenings | Ross Belot",
      description: desc,
      url: absoluteUrl("/happenings"),
    },
    twitter: {
      card: "summary",
      title: "Happenings | Ross Belot",
      description: desc,
    },
  };
}

export default async function HappeningsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active: HappeningsTab =
    tab === "events" ? "events" : tab === "readings" ? "readings" : "news";

  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader
        title="Happenings"
        description="News and appearances — choose a stream below."
      />
      <HappeningsTabs active={active} />
      {active === "news" ? (
        <NewsIndexList />
      ) : active === "events" ? (
        <SiteEventsIndex />
      ) : (
        <OnlineReadingsIndex />
      )}
    </main>
  );
}
