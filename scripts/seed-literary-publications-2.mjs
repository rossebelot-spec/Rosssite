/**
 * Seed: second batch of literary publication appearances.
 * Run from the repo root:  node scripts/seed-literary-publications-2.mjs
 *
 * Items marked published: false need date/detail verification before going live.
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const entries = [
  // ── CONFIRMED ──────────────────────────────────────────────────────────────

  {
    // Belot's poem "First Day" opens Unrau's scholarly book before the introduction
    title: '"First Day"',
    publication: "The Rough Poets: Reading Oil-Worker Poetry (Melanie Dennis Unrau, McGill-Queen's UP)",
    date: "2024",
    kind: "anthology",
    url: "https://www.mqup.ca/rough-poets--the-products-9780228021698.php",
    description: 'Poem "First Day" precedes the introduction to this scholarly study of oil-worker poetry in Canada.',
    display_order: 10,
    published: true,
  },
  {
    // G U E S T issue 17, guest-edited by Melanie Dennis Unrau, above/ground press (Rob McLennan)
    title: "Poem in G U E S T issue 17",
    publication: "G U E S T: A Journal of Guest Editors (above/ground press)",
    date: "2021",
    kind: "journal",
    url: "https://guestpoetryjournal.blogspot.com/2021/06/issue-seventeen-guest-edited-by-melanie.html",
    description: "Guest-edited by Melanie Dennis Unrau. Published by above/ground press (Rob McLennan).",
    display_order: 11,
    published: true,
  },
  {
    // Why to These Rocks: 50 Years of Poems from the Community of Writers (Heyday Books, 2021)
    // Belot attended Community of Writers in 2015 and 2019
    title: "Poem in Why to These Rocks",
    publication: "Why to These Rocks: 50 Years of Poems from the Community of Writers (Heyday Books)",
    date: "2021",
    kind: "anthology",
    url: "https://communityofwriters.org/the-50th-anniversary-poetry-anthology/",
    description: "50th anniversary anthology of the Community of Writers, Olympic Valley, California.",
    display_order: 12,
    published: true,
  },

  // ── NEEDS DATE VERIFICATION (saved as drafts) ──────────────────────────────

  {
    title: "Paul Éluard translation",
    publication: "World Poetry Review",
    date: "2020",   // ← verify
    kind: "translation",
    url: null,
    description: "Translation of Paul Éluard poetry. Date needs verification.",
    display_order: 13,
    published: false,
  },
  {
    title: "Poem",
    publication: "Canadian Literature",
    date: "2020",   // ← verify
    kind: "journal",
    url: null,
    description: "Poem published in Canadian Literature. Date and title need verification.",
    display_order: 14,
    published: false,
  },
  {
    title: "Paul Éluard translation",
    publication: "Packington Review",
    date: "2020",   // ← verify
    kind: "translation",
    url: null,
    description: "Translation of Paul Éluard poetry. Date needs verification.",
    display_order: 15,
    published: false,
  },
  {
    title: "Paul Éluard translation",
    publication: "Blue Unicorn",
    date: "2020",   // ← verify
    kind: "translation",
    url: null,
    description: "Translation of Paul Éluard poetry. Date needs verification.",
    display_order: 16,
    published: false,
  },
  {
    title: '"Poem For Bayfield WI"',
    publication: "The Solitary Plover (Friends of Lorine Niedecker)",
    date: "2023-01",
    kind: "journal",
    url: "https://lorineniedecker.org/solitary-plover/",
    description: "Published in the Winter 2023 issue of The Solitary Plover, the journal of the Friends of Lorine Niedecker.",
    display_order: 17,
    published: true,
  },
  {
    title: "Poem",
    publication: "Workers and Climate Change anthology",
    date: "2022",   // ← verify title and date
    kind: "anthology",
    url: null,
    description: "Anthology of poetry by workers affected by climate change. Full title and date need verification.",
    display_order: 18,
    published: false,
  },
  {
    title: "Book review",
    publication: "Transformation Review",
    date: "2020",   // ← verify
    kind: "journal",
    url: null,
    description: "Book review published in Transformation Review. Title reviewed and date need verification.",
    display_order: 19,
    published: false,
  },
];

console.log("Seeding literary publications (batch 2)…");
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
console.log("\nDone. Items marked ⚠ are saved as drafts — verify dates at /admin/literary-publications before publishing.");
