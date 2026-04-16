/**
 * Seed news coverage items: Globe and Mail, McMaster Alumni (Medium),
 * McMaster Engineering gift guide, and McMaster Alumni Gallery induction.
 *
 * Run from the repo root:  node scripts/seed-news-coverage.mjs
 *
 * Idempotent — checks for existing URL before inserting, safe to re-run.
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

console.log("Seeding news coverage items…\n");

const items = [
  {
    kind: "coverage",
    title: "Retirement means writing poetry and filmmaking for this former oil industry exec",
    outlet: "The Globe and Mail",
    date: "2022-01-01",
    url: "https://www.theglobeandmail.com/investing/personal-finance/retirement/article-how-former-oil-industry-executive-spends-retirement/",
    description:
      "Profile of Ross Belot by Brenda Bouw. After more than three decades in the oil industry, Belot retired in 2014 and turned to poetry, photography, and documentary filmmaking. His collection Moving to Climate Change Hours was named one of the best Canadian poetry books of 2020.",
    display_order: 10,
  },
  {
    kind: "coverage",
    title: "Ross Belot '81",
    outlet: "McMaster Alumni (Medium)",
    date: "2021-01-01",
    url: "https://medium.com/mcmaster-alumni/ross-belot-81-74fe37545f9c",
    description:
      "Alumni profile of Ross Belot (McMaster Engineering '81) on his career transition from the oil industry to poetry and filmmaking. Features his work as a poet, photographer, and environmental writer.",
    display_order: 11,
  },
  {
    kind: "coverage",
    title: "Six unique gift ideas created by McMaster Engineering alumni",
    outlet: "McMaster Faculty of Engineering",
    date: "2020-12-01",
    url: "https://www.eng.mcmaster.ca/news/six-unique-gift-ideas-created-by-mcmaster-engineering-alumni/",
    description:
      "Holiday gift guide featuring Moving to Climate Change Hours among unique gift ideas from McMaster Engineering alumni.",
    display_order: 12,
  },
  {
    kind: "coverage",
    title: "McMaster Alumni Gallery: Ross Belot '81",
    outlet: "McMaster University Alumni",
    date: "2023-01-01",
    url: "https://alumni.mcmaster.ca/s/1439/22/alumnistories/interior.aspx?sid=1439&gid=1&pgid=13013&cid=23357&ecid=23357&crid=0&calpgid=10774&calcid=19503",
    description:
      "Induction of Ross Belot into the 2023 McMaster Alumni Gallery, recognizing his career transition from senior manager at Imperial Oil to poet, filmmaker, and environmental advocate.",
    display_order: 13,
  },
];

for (const item of items) {
  // Check for existing entry by URL (url has no unique constraint, so we check manually)
  const existing = await sql`
    SELECT id FROM news_items WHERE url = ${item.url} LIMIT 1
  `;
  if (existing.length > 0) {
    console.log(`  (skipped — already exists) ${item.outlet}: ${item.title}`);
    continue;
  }

  await sql`
    INSERT INTO news_items
      (kind, title, outlet, date, url, description, display_order, published)
    VALUES (
      ${item.kind},
      ${item.title},
      ${item.outlet},
      ${item.date},
      ${item.url},
      ${item.description},
      ${item.display_order},
      true
    )
  `;
  console.log(`✓  ${item.outlet} — ${item.title.slice(0, 60)}`);
}

console.log("\nDone. Four news coverage items seeded.");
