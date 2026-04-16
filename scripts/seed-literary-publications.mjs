/**
 * One-time seed: insert Ross Belot's literary publication appearances.
 * Run from the repo root:  node scripts/seed-literary-publications.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const entries = [
  {
    title: '"O\'Hare, Terminal Two, Concourse E, Gate E1"',
    publication: "Best Canadian Poetry in English",
    date: "2013",
    kind: "anthology",
    url: null,
    description: "Poem selected for the annual Best Canadian Poetry anthology.",
    display_order: 1,
    published: true,
  },
  {
    title: '"The Edge of Everything"',
    publication: "CBC Poetry Prize — shortlist",
    date: "2016",
    kind: "prize",
    url: null,
    description: "Shortlisted for the CBC Poetry Prize.",
    display_order: 2,
    published: true,
  },
  {
    title: '"Nothing Bothers to Remain"',
    publication: "CBC Poetry Prize — longlist",
    date: "2018",
    kind: "prize",
    url: null,
    description: "Longlisted for the CBC Poetry Prize.",
    display_order: 3,
    published: true,
  },
  {
    title: '"achievement"',
    publication: "Montreal International Poetry Prize — finalist",
    date: "2019",
    kind: "prize",
    url: null,
    description: "Finalist for the Montreal International Poetry Prize.",
    display_order: 4,
    published: true,
  },
  {
    title: "Video poem: What Would I Say Then",
    publication: "9th International Video Poetry Festival, Athens",
    date: "2020",
    kind: "award",
    url: null,
    description: "Selected for the 9th International Video Poetry Festival in Athens, Greece.",
    display_order: 5,
    published: true,
  },
  {
    title: "Paul Éluard — four poems (with Sara Burant)",
    publication: "Periodicities: A Journal of Poetry and Poetics",
    date: "2025",
    kind: "translation",
    url: null,
    description: 'Translations of Paul Éluard including poems from "Nuits partagées", co-translated with Sara Burant.',
    display_order: 6,
    published: true,
  },
  {
    title: "Paul Éluard translations",
    publication: "Delos: A Journal of Translation and World Literature",
    date: "2020",
    kind: "translation",
    url: null,
    description: "Translations of Paul Éluard poetry.",
    display_order: 7,
    published: true,
  },
  {
    title: "Paul Éluard translations",
    publication: "Denver Quarterly",
    date: "2019",
    kind: "translation",
    url: null,
    description: "Translations of Paul Éluard poetry.",
    display_order: 8,
    published: true,
  },
];

console.log("Seeding literary publications…");
for (const entry of entries) {
  await sql`
    INSERT INTO literary_publications
      (title, publication, date, kind, url, description, display_order, published)
    VALUES
      (${entry.title}, ${entry.publication}, ${entry.date}, ${entry.kind},
       ${entry.url}, ${entry.description}, ${entry.display_order}, ${entry.published})
    ON CONFLICT DO NOTHING
  `;
  console.log(`  ✓ ${entry.title} — ${entry.publication} (${entry.date})`);
}
console.log("Done.");
