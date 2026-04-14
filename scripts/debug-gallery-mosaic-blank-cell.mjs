/**
 * Diagnose suspected blank cells in the gallery mosaic (read-only; no app edits).
 * Inspects figures, imgs, rects, and last-row grouping after scrolling to bottom.
 *
 * Usage: node scripts/debug-gallery-mosaic-blank-cell.mjs [baseUrl] [collectionSlug]
 * Requires: dev server on baseUrl, DATABASE_URL for default slug.
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

async function resolveSlug(databaseUrl, argSlug) {
  if (argSlug) return argSlug;
  if (!databaseUrl) return null;
  const sql = neon(databaseUrl);
  const [row] = await sql`
    select slug from collections
    where published = true and media_type = 'photo'
    order by display_order asc nulls last, id asc
    limit 1
  `;
  return row?.slug ?? null;
}

async function main() {
  const base = process.argv[2] ?? "http://127.0.0.1:3000";
  const slugArg = process.argv[3];
  const databaseUrl = loadDatabaseUrl();
  const slug = await resolveSlug(databaseUrl, slugArg);

  if (!slug) {
    console.log(
      JSON.stringify(
        {
          error: "Pass slug as argv[3] or ensure DB has a published photo collection.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const url = `${base.replace(/\/$/, "")}/photography/collections/${slug}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("main figure", { timeout: 30_000 });

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.waitForFunction(
    () => {
      const imgs = [...document.querySelectorAll("main figure img")];
      return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
    },
    { timeout: 45_000 }
  ).catch(() => {
    /* continue with partial data */
  });

  const report = await page.evaluate(() => {
    const grid = document.querySelector(
      "main div.grid.grid-cols-2, main .grid[class*='grid-cols']"
    );
    const figures = [...document.querySelectorAll("main figure")];

    const gridStyle = grid ? getComputedStyle(grid) : null;

    const items = figures.map((fig, index) => {
      const r = fig.getBoundingClientRect();
      const img = fig.querySelector("img");
      const figBg = getComputedStyle(fig).backgroundColor;
      return {
        index,
        rect: {
          top: Math.round(r.top),
          left: Math.round(r.left),
          w: Math.round(r.width),
          h: Math.round(r.height),
        },
        figBackground: figBg,
        img: img
          ? {
              complete: img.complete,
              naturalW: img.naturalWidth,
              naturalH: img.naturalHeight,
              opacity: getComputedStyle(img).opacity,
              position: getComputedStyle(img).position,
              objectFit: getComputedStyle(img).objectFit,
              display: getComputedStyle(img).display,
              currentSrcTail: (img.currentSrc || "").slice(-72),
            }
          : null,
      };
    });

    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    const tops = items.map((x) => x.rect.top);
    const maxTop = Math.max(...tops);
    /** Figures whose block starts at the same row (within 4px) as the bottommost row start */
    const lastRowBandPx = 6;
    const lastRowByTop = items.filter(
      (x) => Math.abs(x.rect.top - maxTop) <= lastRowBandPx
    );

    const bottoms = items.map((x) => x.rect.top + x.rect.h);
    const maxBottom = Math.max(...bottoms);
    const lastRowByBottom = items.filter(
      (x) => Math.abs(x.rect.top + x.rect.h - maxBottom) <= lastRowBandPx
    );

    const suspicious = items.filter((x) => {
      if (!x.img) return true;
      if (!x.img.complete || x.img.naturalW === 0) return true;
      if (x.rect.w < 8 || x.rect.h < 8) return true;
      return false;
    });

    return {
      url: location.href,
      gridFound: Boolean(grid),
      gridAutoRows: gridStyle?.gridAutoRows ?? null,
      gridAutoFlow: gridStyle?.gridAutoFlow ?? null,
      gap: gridStyle?.gap ?? null,
      figureCount: figures.length,
      scrollY,
      viewportH: vh,
      documentScrollHeight: document.documentElement.scrollHeight,
      items,
      lastRowHeuristic: {
        maxTopInViewportCoords: maxTop,
        indicesAlignedWithMaxTop: lastRowByTop.map((x) => x.index),
        maxBottomInViewportCoords: maxBottom,
        indicesAlignedWithMaxBottom: lastRowByBottom.map((x) => x.index),
      },
      suspiciousIndices: suspicious.map((x) => x.index),
      notes: [
        "Rect top/left are viewport coordinates after scroll-to-bottom; last row uses max figure 'top' cluster.",
        "Suspected blank if no img, img incomplete/zero natural size, or figure rect tiny.",
      ],
    };
  });

  await browser.close();

  console.log(JSON.stringify({ slug, url, ...report }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
