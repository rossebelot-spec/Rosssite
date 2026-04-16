/**
 * One-time seed: insert Ross Belot's two poetry collections.
 * Run from the repo root:  node scripts/seed-books.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const books = [
  {
    title: "Swimming in the Dark",
    subtitle: "",
    publisher: "Black Moss Press",
    year: 2008,
    description:
      "Belot's debut collection invokes four essential elements — the vastness of the Canadian landscape, the natural world, longing for another, and the religious — across five sections focused on self-exploration. Developed at the Banff Centre's Wired Writing Studio in 2006.",
    cover_image_url: null,
    buy_url: "https://www.amazon.com/Swimming-Dark-First-Lines-Poetry/dp/0887534503",
    isbn: "978-0-88753-450-8",
    display_order: 1,
    published: true,
  },
  {
    title: "Moving to Climate Change Hours",
    subtitle: "",
    publisher: "Wolsak & Wynn",
    year: 2020,
    description:
      "A solemn ode to the end of oil. From industrial accidents to frozen highways, Belot charts what faces a working man in stripped-down lyric poetry — with a filmmaker's sense of atmosphere and an environmentalist's urgency. Named one of the best Canadian poetry collections of 2020 by CBC Books.",
    cover_image_url: null,
    buy_url: "https://bookstore.wolsakandwynn.ca/products/moving-to-climate-change-hours",
    isbn: "978-1-989496-12-1",
    display_order: 2,
    published: true,
  },
];

console.log("Seeding books…");
for (const book of books) {
  await sql`
    INSERT INTO books
      (title, subtitle, publisher, year, description, cover_image_url, buy_url, isbn, display_order, published)
    VALUES
      (${book.title}, ${book.subtitle}, ${book.publisher}, ${book.year},
       ${book.description}, ${book.cover_image_url}, ${book.buy_url},
       ${book.isbn}, ${book.display_order}, ${book.published})
    ON CONFLICT DO NOTHING
  `;
  console.log(`  ✓ ${book.title}`);
}
console.log("Done.");
