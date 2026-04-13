/**
 * Home hero: DOM + layout checks (run dev first).
 * Usage: node scripts/debug-hero-dom.mjs [baseUrl]
 * Exits 1 if stacking / overlap invariants fail for any viewport.
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:3000";

const viewports = [
  { width: 1280, height: 720, label: "1280×720" },
  { width: 800, height: 600, label: "800×600" },
];

const browser = await chromium.launch();
let anyFail = false;

try {
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto(base, { waitUntil: "load", timeout: 60_000 });
    await page.waitForSelector("section.home-hero-section", { state: "attached", timeout: 30_000 });
    await page.waitForFunction(
      () => document.getElementById("site-header-height-live")?.textContent?.includes("px") ?? false,
      { timeout: 15_000 }
    );

    const report = await page.evaluate(() => {
      const h1 = document.querySelector(".home-hero-name-panel h1");
      const section = document.querySelector("section.home-hero-section");
      const header = document.querySelector("body > header");
      const main = document.querySelector("main");
      if (!h1 || !section) return { error: "missing hero nodes" };

      const rh = header?.getBoundingClientRect();
      const rs = section.getBoundingClientRect();
      const rm = main?.getBoundingClientRect();
      const r1 = h1.getBoundingClientRect();

      const cs = getComputedStyle(h1);
      const heroMin = getComputedStyle(section).minHeight;

      const checks = {
        heroBelowHeader: rh != null && rs.top >= rh.bottom - 2,
        mainBelowHero: rm != null && rm.top >= rs.bottom - 2,
        titleAboveMain: rm != null && r1.bottom <= rm.top + 2,
      };
      const allPass = Object.values(checks).every(Boolean);

      return {
        ok: allPass,
        checks,
        metrics: {
          innerHeight: window.innerHeight,
          scrollY: window.scrollY,
          headerBottom: rh?.bottom,
          heroTop: rs.top,
          heroHeight: rs.height,
          heroMinHeightCss: heroMin,
          mainTop: rm?.top,
          titleBottom: r1.bottom,
          sumHeaderHero: rh != null ? rh.height + rs.height : null,
        },
        dataHeroPortrait: section.getAttribute("data-hero-portrait"),
        computedColor: cs.color,
        computedTextShadow: cs.textShadow,
        outerHTML: h1.outerHTML,
        heroSectionPreview: {
          childCount: section.children.length,
          hasImg: !!section.querySelector("img"),
          innerHTMLSnippet: section.innerHTML.slice(0, 800),
        },
      };
    });

    await page.close();

    const out = { viewport: vp.label, ...report };
    console.log(JSON.stringify(out, null, 2));

    if (report.error || !report.ok) {
      anyFail = true;
    }
  }
} catch (e) {
  console.error(String(e));
  console.error(
    "Tip: restart `npm run dev` after Nav changes, or test against `npm run build` + `next start`."
  );
  anyFail = true;
} finally {
  await browser.close();
}

if (anyFail) {
  console.error("hero layout checks failed");
  process.exit(1);
}
