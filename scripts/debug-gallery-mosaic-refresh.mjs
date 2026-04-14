/**
 * Diagnose gallery mosaic refresh control (Playwright + optional DB facts).
 * Usage: node scripts/debug-gallery-mosaic-refresh.mjs [baseUrl] [collectionSlug]
 * Default baseUrl: http://127.0.0.1:3000
 * Requires: `npm run dev` (or `npm start`) on that host.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

function loadDatabaseUrl() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  try {
    const text = fs.readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const m = trimmed.match(/^DATABASE_URL=(.*)$/);
      if (m) {
        let v = m[1].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        return v;
      }
    }
  } catch {
    /* */
  }
  return process.env.DATABASE_URL ?? "";
}

async function main() {
  const base = process.argv[2] ?? "http://127.0.0.1:3000";
  let slugArg = process.argv[3];

  const databaseUrl = loadDatabaseUrl();
  let dbFacts = { ok: false, error: null };

  if (databaseUrl) {
    try {
      const sql = neon(databaseUrl);
      const [activeRow] = await sql`
        select count(*)::int as n from gallery_photos where is_active = true
      `;
      const [featRow] = await sql`
        select id from gallery_photos where is_featured = true limit 1
      `;
      const [collRow] = await sql`
        select slug from collections
        where published = true and media_type = 'photo'
        order by display_order asc nulls last, id asc
        limit 1
      `;
      const activeCount = activeRow?.n ?? 0;
      const featuredId = featRow?.id ?? null;
      /** Same as GalleryMosaic: non-featured active rows in pool for refresh gating */
      const poolLengthExpected =
        featuredId != null ? Math.max(0, activeCount - 1) : activeCount;
      const showRefreshExpected = poolLengthExpected > 0;

      dbFacts = {
        ok: true,
        galleryPhotosActive: activeCount,
        featuredGalleryPhotoId: featuredId,
        poolLengthExpected,
        showRefreshExpected,
        firstPublishedPhotoCollectionSlug: collRow?.slug ?? null,
      };
      if (!slugArg && collRow?.slug) slugArg = collRow.slug;
    } catch (e) {
      dbFacts = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  } else {
    dbFacts = { ok: false, error: "No DATABASE_URL in .env.local" };
  }

  if (!slugArg) {
    console.log(
      JSON.stringify(
        {
          error: "No collection slug (pass argv[3] or ensure a published photo collection exists in DB).",
          databaseUrlPresent: Boolean(databaseUrl),
          dbFacts,
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const url = `${base.replace(/\/$/, "")}/photography/collections/${slugArg}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  let navigation = { ok: false, status: null, finalUrl: url, error: null };
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    navigation = { ok: true, status: res?.status() ?? null, finalUrl: page.url(), error: null };
  } catch (e) {
    navigation = {
      ok: false,
      status: null,
      finalUrl: page.url(),
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const domReport =
    navigation.ok && page.url().includes("/photography/collections/")
      ? await page.evaluate(() => {
          const main = document.querySelector("main");
          const buttons = main
            ? [...main.querySelectorAll("button")]
            : [...document.querySelectorAll("button")];
          const details = buttons.map((b) => {
            const r = b.getBoundingClientRect();
            const cs = getComputedStyle(b);
            return {
              type: b.getAttribute("type"),
              text: (b.textContent ?? "").trim().slice(0, 80),
              display: cs.display,
              visibility: cs.visibility,
              opacity: cs.opacity,
              rect: { x: r.x, y: r.y, w: r.width, h: r.height },
              inViewport:
                r.width > 0 &&
                r.height > 0 &&
                r.bottom > 0 &&
                r.right > 0 &&
                r.top < window.innerHeight &&
                r.left < window.innerWidth,
            };
          });

          const refreshCandidates = buttons.filter((b) =>
            /→|surprise|shuffle|more|again|light|going/i.test(
              (b.textContent ?? "").trim()
            )
          );

          const figureCount = document.querySelectorAll("main figure").length;
          const mainRect = main?.getBoundingClientRect();
          return {
            title: document.title,
            figureCount,
            mainScrollHeight: main?.scrollHeight ?? null,
            mainClientHeight: main?.clientHeight ?? null,
            windowInnerHeight: window.innerHeight,
            scrollY: window.scrollY,
            mainBottom: mainRect != null ? mainRect.bottom : null,
            buttonCount: buttons.length,
            buttons: details,
            refreshCandidateCount: refreshCandidates.length,
            refreshCandidateTexts: refreshCandidates.map((b) =>
              (b.textContent ?? "").trim()
            ),
            mainInnerHTMLLength: main?.innerHTML?.length ?? 0,
          };
        })
      : null;

  await browser.close();

  const out = {
    urlAttempted: url,
    navigation,
    databaseUrlPresent: Boolean(databaseUrl),
    dbFacts,
    domReport,
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
