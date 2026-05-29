"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HappeningsTabs, type HappeningsTab } from "./happenings-tabs";

function tabFromValue(value: string | null): HappeningsTab {
  return value === "events" ? "events" : value === "readings" ? "readings" : "news";
}

/**
 * Client tab controller for /happenings. All three streams are rendered into the
 * static HTML (passed in as server-rendered nodes); this only toggles which one
 * is visible based on `?tab=`, so the page never has to render per request.
 */
export function HappeningsView({
  news,
  events,
  readings,
}: {
  news: ReactNode;
  events: ReactNode;
  readings: ReactNode;
}) {
  const [active, setActive] = useState<HappeningsTab>("news");

  // Honor ?tab= on mount and on browser back/forward navigation.
  useEffect(() => {
    const syncFromUrl = () => {
      setActive(tabFromValue(new URLSearchParams(window.location.search).get("tab")));
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const handleSelect = (tab: HappeningsTab) => {
    setActive(tab);
    // Reflect the selection in a shareable URL without a server round-trip.
    window.history.pushState(null, "", tab === "news" ? "/happenings" : `/happenings?tab=${tab}`);
  };

  return (
    <>
      <HappeningsTabs active={active} onSelect={handleSelect} />
      <div role="tabpanel" hidden={active !== "news"}>
        {news}
      </div>
      <div role="tabpanel" hidden={active !== "events"}>
        {events}
      </div>
      <div role="tabpanel" hidden={active !== "readings"}>
        {readings}
      </div>
    </>
  );
}
