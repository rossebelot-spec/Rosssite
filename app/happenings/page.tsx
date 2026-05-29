import type { Metadata } from "next";
import { SectionHeader } from "@/components/section-header";
import { HappeningsView } from "@/components/happenings/happenings-view";
import { NewsIndexList } from "@/components/happenings/news-index-list";
import { SiteEventsIndex } from "@/components/happenings/site-events-index";
import { OnlineReadingsIndex } from "@/components/happenings/online-readings-index";
import { absoluteUrl } from "@/lib/seo";

// Static — all three streams are rendered into the cached HTML; the active tab
// (?tab=) is toggled client-side, so the page never renders per request.
export const dynamic = "force-static";
export const revalidate = false;

const description =
  "News and appearances by Ross Belot — coverage, events, and video readings.";

export const metadata: Metadata = {
  title: "Happenings",
  description,
  alternates: { canonical: "/happenings" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Ross Belot",
    title: "Happenings | Ross Belot",
    description,
    url: absoluteUrl("/happenings"),
  },
  twitter: {
    card: "summary",
    title: "Happenings | Ross Belot",
    description,
  },
};

export default async function HappeningsPage() {
  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader
        title="Happenings"
        description="News and appearances — choose a stream below."
      />
      <HappeningsView
        news={<NewsIndexList />}
        events={<SiteEventsIndex />}
        readings={<OnlineReadingsIndex />}
      />
    </main>
  );
}
