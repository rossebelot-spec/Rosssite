/**
 * Seed press/news coverage items scraped from rossbelot.com/press/.
 * Covers items that may not yet be in the DB.
 *
 * Run from the repo root:  node scripts/seed-press-from-old-site.mjs
 *
 * Idempotent — checks for existing URL before inserting.
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

console.log("Seeding press items from old site…\n");

const items = [
  {
    kind: "coverage",
    title: "11 New Books That Will Change How You Think About the Climate Crisis",
    outlet: "Shondaland",
    date: "2020-08-07",
    url: "https://www.shondaland.com/inspire/books/a33501482/11-new-books-that-will-change-how-you-think-about-the-climate-crisis/",
    description:
      '"This is a great speculative and lyrical collection that asks hard questions with no easy answers." — Sarah Neilson, Shondaland. Moving to Climate Change Hours named one of eleven books that will change how you think about the climate crisis.',
    display_order: 1,
  },
  {
    kind: "coverage",
    title: "Interview with Crystal Fletcher — All About Canadian Books (YouTube)",
    outlet: "All About Canadian Books",
    date: "2020-11-01",
    url: "https://youtu.be/KirFNIX6vck",
    description:
      "Crystal Fletcher interviews Ross Belot for her YouTube channel about Moving to Climate Change Hours.",
    display_order: 2,
  },
  {
    kind: "coverage",
    title: "The Environmental Urbanist — Interview with Jason Allen",
    outlet: "CFMU / The Environmental Urbanist",
    date: "2021-01-05",
    url: "https://cfmu.ca/episodes/24589-the-environmental-urbanist-episode-for-2021-01-05",
    description:
      "Ross Belot in conversation with Jason Allen about his path to eco-poetics and environmental writing after years in the fossil fuel industry.",
    display_order: 3,
  },
  {
    kind: "coverage",
    title: "Moving to Climate Change Hours — Book Review",
    outlet: "The Pilar (Santo Tomas University School of Journalism)",
    date: "2021-03-12",
    url: "https://thepilaronline.wordpress.com/2021/03/12/the-pilar-lifestyle-5/",
    description:
      'Named one of five books presenting "the effects of climate change on the world in a hauntingly lyrical way" by the school of journalism at Santo Tomas, Philippines.',
    display_order: 4,
  },
  {
    kind: "coverage",
    title: "Ross Belot — Finalist, Montreal International Poetry Prize",
    outlet: "Montreal International Poetry Prize",
    date: "2022-09-21",
    url: "https://www.montrealpoetryprize.com/2022-competition-1",
    description:
      "Shortlisted for the prestigious $20K Montreal International Poetry Prize, run out of McGill University.",
    display_order: 6,
  },
  {
    kind: "coverage",
    title: "Moving to Climate Change Hours — Catherine Owen Review",
    outlet: "Marrow Reviews",
    date: "2020-09-22",
    url: "https://crowgirl11.wordpress.com/2020/09/18/moving-to-climate-change-hours-by-ross-belot-wolsak-wynn-james-street-north-books-2020/",
    description:
      '"In these pieces, I hear the seeming simplicity of Gary Snyder\'s entrees into how the crow, the ocean, the mountains can render us texts, in essence, of both knowing and unknowing." — Catherine Owen.',
    display_order: 7,
  },
  {
    kind: "coverage",
    title: "Most Anticipated Spring 2020 Poetry",
    outlet: "49th Shelf",
    date: "2020-02-06",
    url: "https://49thshelf.com/Blog/2020/02/06/Most-Anticipated-Spring-2020-Poetry-Preview",
    description:
      "Moving to Climate Change Hours named to 49th Shelf's Most Anticipated Spring 2020 Poetry list.",
    display_order: 8,
  },
  {
    kind: "coverage",
    title: "Ross Belot — Finalist, 2016 CBC Poetry Prize",
    outlet: "CBC Books",
    date: "2016-11-10",
    url: "https://www.cbc.ca/books/literaryprizes/cbc-poetry-prize-1.4090929",
    description:
      "Shortlisted for the 2016 CBC Poetry Prize, in partnership with Canada Council for the Arts, Air Canada enRoute magazine, and Banff Centre.",
    display_order: 9,
  },
  {
    kind: "coverage",
    title: "Nothing Bothers to Remain — 2018 CBC Poetry Prize Longlist",
    outlet: "CBC Books",
    date: "2018-10-31",
    url: "https://www.cbc.ca/books/literaryprizes/nothing-bothers-to-remain-by-ross-belot-1.4876253",
    description:
      "Suite of poems Nothing Bothers to Remain longlisted for the 2018 CBC Poetry Prize.",
    display_order: 10,
  },
];

for (const item of items) {
  const existing = await sql`
    SELECT id FROM news_items WHERE url = ${item.url} LIMIT 1
  `;
  if (existing.length > 0) {
    console.log(`  (skipped — already exists) ${item.outlet}: ${item.title.slice(0, 50)}`);
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
  console.log(`✓  ${item.outlet} — ${item.title.slice(0, 55)}`);
}

console.log("\nDone.");
