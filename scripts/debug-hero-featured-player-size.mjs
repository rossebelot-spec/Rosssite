/**
 * Data for hero featured player size RCA: git ref, :root token, measured geometry,
 * and modeled min() for current token vs "big" commit 716fcb9 vs pure column width.
 *
 * Usage (dev server running): node scripts/debug-hero-featured-player-size.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";

const base = process.argv[2] ?? "http://127.0.0.1:3000";

let gitHead = "";
let gitDirty = "";
try {
  gitHead = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  gitDirty = execSync("git status --porcelain app/globals.css components/home-featured-video-player.tsx 2>/dev/null", {
    encoding: "utf8",
  }).trim();
} catch {
  gitHead = "unknown";
}

function modeledMin(stackPx, innerW, pct, vwFrac, remPxCap) {
  const a = stackPx * (pct / 100);
  const b = innerW * vwFrac;
  const c = remPxCap;
  return { arms: { pct: a, vw: b, rem: c }, min: Math.min(a, b, c), binding: [a, b, c].indexOf(Math.min(a, b, c)) };
}

const viewports = [
  { width: 800, height: 720 },
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 1920, height: 900 },
];

const browser = await chromium.launch();
const report = { git: { HEAD: gitHead, globalsCssDirty: Boolean(gitDirty), note: gitDirty || "clean for listed files" } };

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: vp });
  try {
    await page.goto(base, { waitUntil: "load", timeout: 30_000 });
    await page.waitForSelector("section.home-hero-section", { timeout: 15_000 }).catch(() => null);

    const row = await page.evaluate(() => {
      const root = document.documentElement;
      const token = getComputedStyle(root).getPropertyValue("--hero-featured-player-width").trim();
      const player = document.querySelector(".home-hero-featured-player");
      const stack = document.querySelector(".hero-text-stack");
      if (!player || !stack) {
        return {
          error: "no player or stack",
          featuredAttr: document.querySelector("section.home-hero-section")?.getAttribute("data-hero-featured-video"),
        };
      }
      const rp = player.getBoundingClientRect();
      const rs = stack.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(root).fontSize) || 16;
      return {
        innerWidth: window.innerWidth,
        remPx: fs,
        tokenRaw: token || "(empty — token missing on :root)",
        stackW: rs.width,
        playerW: rp.width,
        computedPlayerWidth: getComputedStyle(player).width,
        playerClass: player.className,
      };
    });

    if (row.error) {
      report[`${vp.width}x${vp.height}`] = row;
      await page.close();
      continue;
    }

    const stack = row.stackW;
    const inner = row.innerWidth;
    const remPx = row.remPx;

    const cur = modeledMin(stack, inner, 128, 0.52, 44 * remPx);
    const old716 = modeledMin(stack, inner, 132, 0.54, 42 * remPx);

    report[`${vp.width}x${vp.height}`] = {
      ...row,
      modeledCurrentToken: cur,
      modeled716fcb9: old716,
      widthIfRevertCommittedOnly: stack,
      measuredMinus716fcb9Model: row.playerW - old716.min,
    };
  } catch (e) {
    report[`${vp.width}x${vp.height}`] = { error: String(e.message ?? e) };
  }
  await page.close();
}

await browser.close();

console.log(JSON.stringify(report, null, 2));
