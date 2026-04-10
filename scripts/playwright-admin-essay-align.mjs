/**
 * Playwright: admin essay editor, first paragraph, center align, raw DOM report.
 * Requires: npm run dev on 127.0.0.1:3000, DATABASE_URL in .env.local
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const BASE = "http://127.0.0.1:3000";

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
    /* missing */
  }
  return process.env.DATABASE_URL ?? "";
}

async function resolveWilliamsEssayId(databaseUrl) {
  const sql = neon(databaseUrl);
  const rows = await sql`
    select id, title, slug
    from essays
    where slug ilike '%williams%'
       or title ilike '%williams%'
    order by id
    limit 1
  `;
  if (!rows.length) {
    throw new Error("No essay matched slug/title ilike '%williams%'");
  }
  return rows[0];
}

async function serverOk(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const dbUrl = loadDatabaseUrl();
  if (!dbUrl) throw new Error("DATABASE_URL missing");

  const essay = await resolveWilliamsEssayId(dbUrl);
  const url = `${BASE}/admin/essays/${essay.id}`;

  if (!(await serverOk(`${BASE}/`))) {
    throw new Error(`Dev server not responding at ${BASE}/`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "load", timeout: 120_000 });

  await page.locator(".ProseMirror").first().waitFor({ state: "visible", timeout: 60_000 });

  const report = await page.evaluate(() => {
    const root = document.querySelector(".ProseMirror");
    if (!root) return { error: "No .ProseMirror" };

    const paragraphs = Array.from(root.querySelectorAll("p"));
    let p = null;
    for (const el of paragraphs) {
      const words = el.textContent?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      if (words >= 8) {
        p = el;
        break;
      }
    }
    if (!p && paragraphs.length) {
      p = paragraphs.find((el) => (el.textContent?.trim().length ?? 0) > 0) ?? paragraphs[0];
    }
    if (!p) return { error: "No paragraph in .ProseMirror" };

    const box = p.getBoundingClientRect();
    return {
      pick: { wordThresholdUsed: 8, paragraphIndex: paragraphs.indexOf(p) },
      clickTarget: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
    };
  });

  if (report.error) {
    await browser.close();
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  await page.mouse.click(report.clickTarget.x, report.clickTarget.y);

  await page.evaluate(() => {
    const root = document.querySelector(".ProseMirror");
    const paragraphs = Array.from(root.querySelectorAll("p"));
    let p = null;
    for (const el of paragraphs) {
      const words = el.textContent?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      if (words >= 8) {
        p = el;
        break;
      }
    }
    if (!p && paragraphs.length) {
      p = paragraphs.find((el) => (el.textContent?.trim().length ?? 0) > 0) ?? paragraphs[0];
    }
    if (!p) return;
    const range = document.createRange();
    range.selectNodeContents(p);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  });

  await page.getByRole("button", { name: "Align center" }).click();

  const data = await page.evaluate(() => {
    const root = document.querySelector(".ProseMirror");
    const paragraphs = Array.from(root.querySelectorAll("p"));
    let p = null;
    for (const el of paragraphs) {
      const words = el.textContent?.trim().split(/\s+/).filter(Boolean).length ?? 0;
      if (words >= 8) {
        p = el;
        break;
      }
    }
    if (!p && paragraphs.length) {
      p = paragraphs.find((el) => (el.textContent?.trim().length ?? 0) > 0) ?? paragraphs[0];
    }
    if (!p) return { error: "No paragraph after click" };

    const ancestors = [];
    let el = p;
    while (el) {
      ancestors.push({
        tagName: el.tagName,
        className: el.className?.toString?.() ?? "",
        computedTextAlign: getComputedStyle(el).textAlign,
      });
      if (el.matches?.(".essay-body")) break;
      el = el.parentElement;
    }

    return {
      paragraphOuterHTML: p.outerHTML,
      paragraphStyleAttribute: p.getAttribute("style"),
      paragraphComputedTextAlign: getComputedStyle(p).textAlign,
      ancestorsToEssayBody: ancestors,
    };
  });

  await browser.close();

  const out = {
    adminUrl: url,
    essayId: essay.id,
    essaySlug: essay.slug,
    essayTitle: essay.title,
    pickMeta: report.pick,
    ...data,
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.log(JSON.stringify({ error: String(err?.message ?? err), stack: err?.stack }, null, 2));
  process.exit(1);
});
