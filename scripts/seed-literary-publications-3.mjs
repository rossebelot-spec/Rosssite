/**
 * Seed: Minute Review Éluard translations + Hamilton Film Festival video poem.
 * Run from the repo root:  node scripts/seed-literary-publications-3.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const entries = [
  // ── CONFIRMED ─────────────────────────────────────────────────────────────

  {
    // Most recent — announced March 2026
    title: "Paul Éluard translation",
    publication: "The Minute Review",
    date: "2026",
    kind: "translation",
    url: null,
    description: "Translation of Paul Éluard poetry. Announced March 2026. Verify edition number and URL when available.",
    display_order: 20,
    published: true,
  },
  {
    // Previous edition — 2025
    title: "Paul Éluard translation",
    publication: "The Minute Review",
    date: "2025",
    kind: "translation",
    url: null,
    description: "Translation of Paul Éluard poetry. Verify edition number and URL.",
    display_order: 21,
    published: true,
  },
  {
    title: 'Video poem: "Marriage"',
    publication: "Hamilton Film Festival",
    date: "2020-11-15",
    kind: "award",
    url: "https://www.wolsakandwynn.ca/events/marriage-by-ross-belot-at-the-hff-mz7tg",
    description: 'Video poem "Marriage" screened at the Hamilton Film Festival, November 15, 2020.',
    display_order: 23,
    published: true,
  },
];

console.log("Seeding literary publications (batch 3)…");
for (const entry of entries) {
  await sql`
    INSERT INTO literary_publications
      (title, publication, date, kind, url, description, display_order, published)
    VALUES
      (${entry.title}, ${entry.publication}, ${entry.date}, ${entry.kind},
       ${entry.url}, ${entry.description}, ${entry.display_order}, ${entry.published})
    ON CONFLICT DO NOTHING
  `;
  const status = entry.published ? "✓" : "⚠ draft";
  console.log(`  ${status}  ${entry.title} — ${entry.publication}`);
}
console.log("\nDone.");
