import type { Metadata } from "next";
import { SiteEventsIndex } from "@/components/happenings/site-events-index";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Events",
  description: "Readings, launches, and appearances.",
  alternates: { canonical: "/events" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Ross Belot",
    title: "Events | Ross Belot",
    description: "Readings, launches, and appearances.",
    url: absoluteUrl("/events"),
  },
  twitter: {
    card: "summary",
    title: "Events | Ross Belot",
    description: "Readings, launches, and appearances.",
  },
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SiteEventsIndex withPageHeader />
    </main>
  );
}
