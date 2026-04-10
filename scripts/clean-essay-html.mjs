/**
 * One-time cleanup: strip Word-pasted inline styles and empty paragraph
 * spacers from the Williams essay (or any essay by slug pattern).
 *
 * Usage:
 *   node scripts/clean-essay-html.mjs                  # dry-run (shows diff)
 *   node scripts/clean-essay-html.mjs --commit         # writes to DB
 *   node scripts/clean-essay-html.mjs --slug=pattern   # target different essay
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const commit = args.includes("--commit");
const slugArg = args.find((a) => a.startsWith("--slug="));
const slugPattern = slugArg ? slugArg.split("=")[1] : "%williams%";

function loadDatabaseUrl() {
  const envPath = path.join(__dirname, "..", ".env.local");
  try {
    const text = fs.readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.trim().match(/^DATABASE_URL=(.*)/);
      if (m) {
        let v = m[1].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        )
          v = v.slice(1, -1);
        return v;
      }
    }
  } catch {}
  return process.env.DATABASE_URL ?? "";
}

// ── Style cleanup (mirrors client-side cleanPastedHTML logic) ───────────

const KEEP_PROPS = new Set([
  "color",
  "background-color",
  "text-align",
  "text-decoration",
]);
const DEFAULT_COLORS = new Set([
  "black",
  "rgb(0, 0, 0)",
  "rgb(0,0,0)",
  "#000000",
  "#000",
  "windowtext",
]);

function cleanStyleAttr(styleStr) {
  const kept = [];
  for (const decl of styleStr.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim();
    if (!KEEP_PROPS.has(prop)) continue;
    if (prop === "color" && DEFAULT_COLORS.has(val.toLowerCase())) continue;
    kept.push(`${prop}: ${val}`);
  }
  return kept.length ? ` style="${kept.join("; ")}"` : "";
}

function cleanHTML(html) {
  let out = html;

  // 1. Rewrite <span style="..."> keeping only allowed props
  out = out.replace(/<span\s+style="([^"]*)"\s*>/gi, (_match, style) => {
    const cleaned = cleanStyleAttr(style);
    return cleaned ? `<span${cleaned}>` : "<span>";
  });

  // 2. Remove class attributes
  out = out.replace(/\s+class="[^"]*"/gi, "");

  // 3. Unwrap bare <span> (no attributes) — repeat until stable
  let prev = "";
  while (out !== prev) {
    prev = out;
    out = out.replace(/<span>([\s\S]*?)<\/span>/g, "$1");
  }

  // 4. Remove empty paragraphs (truly empty, whitespace-only, or &nbsp;-only)
  out = out.replace(/<p>\s*<\/p>/g, "");
  out = out.replace(/<p>(\s|&nbsp;)*<\/p>/g, "");
  out = out.replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, "");

  // 5. Collapse runs of whitespace between tags (cosmetic)
  out = out.replace(/>\s+</g, "><");

  return out;
}

// ── Main ────────────────────────────────────────────────────────────────

const dbUrl = loadDatabaseUrl();
if (!dbUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sql = neon(dbUrl);

const rows = await sql`
  SELECT id, slug, body_html
  FROM essays
  WHERE slug ILIKE ${slugPattern}
  LIMIT 1
`;

if (!rows.length) {
  console.log("No essay matched pattern:", slugPattern);
  process.exit(0);
}

const { id, slug, body_html: original } = rows[0];
const cleaned = cleanHTML(original);

console.log(`Essay: ${slug} (id=${id})`);
console.log(`Original: ${original.length} chars`);
console.log(`Cleaned:  ${cleaned.length} chars`);
console.log(`Removed:  ${original.length - cleaned.length} chars\n`);

// Show a sample of what changed
const origLines = original.split(/(?=<p|<blockquote|<h[1-6])/g).filter(Boolean);
const cleanLines = cleaned.split(/(?=<p|<blockquote|<h[1-6])/g).filter(Boolean);
console.log(`Original block count: ${origLines.length}`);
console.log(`Cleaned block count:  ${cleanLines.length}\n`);

// Show first 5 cleaned blocks as preview
console.log("── Preview (first 5 blocks) ──");
for (const line of cleanLines.slice(0, 5)) {
  console.log(line.slice(0, 120) + (line.length > 120 ? "..." : ""));
}

if (!commit) {
  console.log("\nDry run. Pass --commit to write to DB.");
  process.exit(0);
}

await sql`UPDATE essays SET body_html = ${cleaned}, updated_at = now() WHERE id = ${id}`;
console.log("\nDB updated successfully.");
