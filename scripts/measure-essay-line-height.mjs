/**
 * Measures computed typography on a real essay paragraph (Playwright + Chromium).
 * Run: node scripts/measure-essay-line-height.mjs
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const BASE = "http://127.0.0.1:3000";
const ESSAY_PATH =
  "/essays/william-carlos-williams-spring-and-all-and-me";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function serverResponds(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

let spawnedDev = null;

async function ensureDevServer() {
  const home = `${BASE}/`;
  if (await serverResponds(home)) {
    return { weStarted: false };
  }

  spawnedDev = spawn("npm", ["run", "dev"], {
    cwd: REPO_ROOT,
    shell: true,
    stdio: "pipe",
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    await sleep(400);
    if (await serverResponds(home) && (await serverResponds(`${BASE}${ESSAY_PATH}`))) {
      return { weStarted: true };
    }
  }

  throw new Error("Dev server did not become ready within 120s");
}

function cleanupDev() {
  if (spawnedDev && !spawnedDev.killed) {
    spawnedDev.kill("SIGTERM");
  }
}

process.on("exit", cleanupDev);
process.on("SIGINT", () => {
  cleanupDev();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanupDev();
  process.exit(143);
});

function countWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function parsePx(value) {
  if (value == null || value === "") return null;
  const m = String(value).trim().match(/^([\d.]+)px$/i);
  if (m) return Number(m[1]);
  return null;
}

async function main() {
  await ensureDevServer();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE}${ESSAY_PATH}`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });

  const data = await page.evaluate(() => {
    const article = document.querySelector("article.essay-body");
    if (!article) {
      return { error: "article.essay-body not found" };
    }

    const paragraphs = Array.from(article.querySelectorAll("p"));
    let p = null;
    let wordCount = 0;
    for (const el of paragraphs) {
      const n = el.textContent?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      if (n >= 20) {
        p = el;
        wordCount = n;
        break;
      }
    }

    if (!p) {
      return { error: "No <p> with >= 20 words inside article.essay-body" };
    }

    const cs = getComputedStyle(p);
    const articleStyleAttr = article.getAttribute("style");
    const pStyleAttr = p.getAttribute("style");

    const directChildren = Array.from(p.children).map((ch) => ({
      tagName: ch.tagName.toLowerCase(),
      styleAttribute: ch.getAttribute("style"),
    }));

    return {
      wordCount,
      computedLineHeight: cs.lineHeight,
      computedFontSize: cs.fontSize,
      paragraphStyleAttribute: pStyleAttr,
      directChildren,
      articleClassName: article.className,
      articleStyleAttribute: articleStyleAttr,
    };
  });

  await browser.close();

  if (data.error) {
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const lhPx = parsePx(data.computedLineHeight);
  const fsPx = parsePx(data.computedFontSize);
  const ratio =
    lhPx != null && fsPx != null && fsPx !== 0 ? lhPx / fsPx : null;

  const out = {
    computedLineHeightRaw: data.computedLineHeight,
    computedLineHeightPx: lhPx,
    computedFontSizeRaw: data.computedFontSize,
    computedFontSizePx: fsPx,
    lineHeightOverFontSize: ratio,
    paragraphWordCount: data.wordCount,
    paragraphStyleAttribute: data.paragraphStyleAttribute,
    directChildInlineStyles: data.directChildren,
    articleClassName: data.articleClassName,
    articleStyleAttribute: data.articleStyleAttribute,
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  cleanupDev();
  process.exit(1);
});
