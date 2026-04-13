/**
 * Timeline probe for home hero + header height (refresh / CLS / scroll restoration).
 * Usage: node scripts/debug-hero-refresh-timeline.mjs [baseUrl]
 *
 * Does not exit non-zero — prints JSON findings for analysis.
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:3000";

function metrics() {
  const html = document.documentElement;
  const section = document.querySelector("section.home-hero-section");
  const header = document.querySelector("body > header");
  const main = document.querySelector("main");
  const live = document.getElementById("site-header-height-live");
  const rs = section?.getBoundingClientRect();
  const rh = header?.getBoundingClientRect();

  return {
    t: Math.round(performance.now()),
    scrollY: window.scrollY,
    scrollH: html.scrollHeight,
    clientH: html.clientHeight,
    innerH: window.innerHeight,
    rootHeaderVar: getComputedStyle(html).getPropertyValue("--site-header-height").trim(),
    heroH: rs?.height ?? null,
    heroTop: rs?.top ?? null,
    headerBottom: rh?.bottom ?? null,
    headerOffsetH: header?.offsetHeight ?? null,
    mainTop: main?.getBoundingClientRect().top ?? null,
    liveText: live?.textContent?.trim() ?? null,
    liveExists: Boolean(live),
  };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.addInitScript(() => {
  window.__heroProbe = [];
  const push = (phase) => {
    try {
      const html = document.documentElement;
      const section = document.querySelector("section.home-hero-section");
      const header = document.querySelector("body > header");
      const live = document.getElementById("site-header-height-live");
      const rs = section?.getBoundingClientRect();
      const rh = header?.getBoundingClientRect();
      window.__heroProbe.push({
        phase,
        time: performance.now(),
        readyState: document.readyState,
        scrollY: window.scrollY,
        scrollH: html.scrollHeight,
        rootVar: getComputedStyle(html).getPropertyValue("--site-header-height").trim(),
        heroH: rs?.height ?? null,
        heroTop: rs?.top ?? null,
        headerOffsetH: header?.offsetHeight ?? null,
        liveExists: Boolean(live),
        liveSnippet: live?.textContent?.trim()?.slice(0, 60) ?? null,
      });
    } catch {
      window.__heroProbe.push({ phase, err: true });
    }
  };
  document.addEventListener("readystatechange", () => {
    push(`readystate-${document.readyState}`);
  });
  window.addEventListener("DOMContentLoaded", () => push("DOMContentLoaded"));
  window.addEventListener("load", () => push("load"));
});

async function pollAfterNav(label, msTotal = 800, stepMs = 16) {
  const series = [];
  const t0 = Date.now();
  while (Date.now() - t0 < msTotal) {
    const m = await page.evaluate(metrics);
    series.push({ ...m, elapsed: Date.now() - t0 });
    await page.waitForTimeout(stepMs);
  }
  return { label, series };
}

// ── Run A: load at scroll 0, then poll ─────────────────────────────
await page.goto(base, { waitUntil: "load", timeout: 60_000 });
await page.waitForSelector("section.home-hero-section", { timeout: 30_000 });
const probeA = await page.evaluate(() => window.__heroProbe ?? []);
const afterA = await pollAfterNav("after-first-goto-load", 600, 20);
const finalA = await page.evaluate(metrics);

// ── Run B: scroll down, reload, capture scroll + layout shift ─────
await page.evaluate(() => window.scrollTo(0, 420));
await page.waitForTimeout(50);
const scrollBeforeReload = await page.evaluate(() => window.scrollY);

await page.reload({ waitUntil: "load", timeout: 60_000 });
const probeB = await page.evaluate(() => window.__heroProbe ?? []);
const scrollAfterReloadImmediate = await page.evaluate(metrics);
const afterB = await pollAfterNav("after-reload-poll", 800, 20);
const scrollEnd = await page.evaluate(() => window.scrollY);

// ── Run C: compare computed min-height at fallback vs after live style ─
const cssCompare = await page.evaluate(() => {
  const html = document.documentElement;
  const section = document.querySelector("section.home-hero-section");
  const live = document.getElementById("site-header-height-live");
  const measured = getComputedStyle(section).minHeight;
  const liveText = live?.textContent ?? "";
  // Temporarily neutralize live override to sample "fallback-only" (4.5rem on :root)
  let withoutLive = null;
  if (live?.parentNode) {
    const prev = live.textContent;
    live.textContent = "";
    withoutLive = getComputedStyle(section).minHeight;
    live.textContent = prev;
  }
  return { measuredMinHeight: measured, withoutLiveOverrideMinHeight: withoutLive, liveText };
});

await browser.close();

const report = {
  summary: {
    scrollBeforeReload,
    scrollAfterReload_firstSample: scrollAfterReloadImmediate.scrollY,
    scrollH_afterReload: scrollAfterReloadImmediate.scrollH,
    scrollEnd_after800msPoll: scrollEnd,
    rootVar_firstPaintAfterReload: scrollAfterReloadImmediate.rootHeaderVar,
    heroH_delta_firstVs_poll:
      afterB.series.length > 1
        ? afterB.series[afterB.series.length - 1].heroH - afterB.series[0].heroH
        : null,
  },
  initScriptProbe_firstNavigation: probeA,
  initScriptProbe_afterReload: probeB,
  poll_afterFirstGoto: afterA,
  poll_afterReload: afterB,
  cssCompare,
  conclusion: [],
};

// Heuristic root-cause lines
const first = afterB.series[0];
const last = afterB.series[afterB.series.length - 1];
if (first && last && Math.abs((first.heroH ?? 0) - (last.heroH ?? 0)) > 2) {
  report.conclusion.push(
    "Hero section height changes between first post-load sample and ~800ms later — consistent with CSS variable updating from 4.5rem fallback to measured px (layout shift / CLS)."
  );
}
if (
  scrollBeforeReload >= 100 &&
  Math.abs(scrollAfterReloadImmediate.scrollY - scrollBeforeReload) > 50
) {
  report.conclusion.push(
    "Scroll position differed materially across reload — may indicate scroll restoration vs changing document height after hydration."
  );
}
if (cssCompare.withoutLiveOverrideMinHeight && cssCompare.measuredMinHeight) {
  if (cssCompare.withoutLiveOverrideMinHeight !== cssCompare.measuredMinHeight) {
    report.conclusion.push(
      `Computed hero min-height differs with live style removed (${cssCompare.withoutLiveOverrideMinHeight}) vs current (${cssCompare.measuredMinHeight}) — confirms injected :root rule changes hero band size.`
    );
  }
}

console.log(JSON.stringify(report, null, 2));
