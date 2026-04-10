/**
 * Load admin essay editor URL, screenshot, report DOM state (no clicks).
 * Run: node scripts/admin-essay-debug.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const BASE = "http://127.0.0.1:3000";
const SCREENSHOT_PATH = "/tmp/admin-essay-debug.png";

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

async function main() {
  const dbUrl = loadDatabaseUrl();
  if (!dbUrl) throw new Error("DATABASE_URL missing");

  const sql = neon(dbUrl);
  const rows = await sql`
    select id from essays
    where slug ilike '%williams%' or title ilike '%williams%'
    order by id limit 1
  `;
  if (!rows.length) throw new Error("No Williams essay in DB");
  const id = rows[0].id;
  const url = `${BASE}/admin/essays/${id}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "load", timeout: 120_000 });

  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });

  const finalUrl = page.url();
  const title = await page.title();
  const proseMirrorCount = await page.locator(".ProseMirror").count();
  const proseMirrorExists = proseMirrorCount > 0;

  let fullPageHtml = null;
  if (!proseMirrorExists) {
    fullPageHtml = await page.content();
  }

  await browser.close();

  const out = {
    requestedUrl: url,
    pageUrlAfterNavigation: finalUrl,
    pageTitle: title,
    proseMirrorExists,
    proseMirrorCount,
    screenshotPath: SCREENSHOT_PATH,
    fullPageHtml: fullPageHtml ?? undefined,
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.log(JSON.stringify({ error: String(err?.message ?? err) }, null, 2));
  process.exit(1);
});
