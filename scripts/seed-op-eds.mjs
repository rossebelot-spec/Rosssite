/**
 * Seed op-eds: migrate static op-eds data to the database.
 *
 * Run: node scripts/seed-op-eds.mjs
 *
 * Idempotent — checks for existing rows by URL before inserting.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { config } = await import("dotenv");
config({ path: path.resolve(__dirname, "../.env.local") });

const { neon } = await import("@neondatabase/serverless");

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(url);

// ─── National Observer Articles ───────────────────────────────────────────────

const nationalObserverArticles = [
  {
    title: "Reality trumps a Poilievre oil fantasy",
    date: "2026-01-23",
    url: "https://www.nationalobserver.com/2026/01/23/opinion/poilievre-oil-pipeline-oilsands-venezuela",
    summary: "Conservative Leader Pierre Poilievre's proposed new oil pipeline from Alberta to the West Coast is flawed on so many levels.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2026/01/22/cp175469577.JPG",
    pull_quote: "We need to move millions of barrels a day to overseas markets quickly to reduce our dependence on the U.S. market.",
  },
  {
    title: "Why Carney's pivot to Keystone XL is brilliant, even if it's just a fantasy",
    date: "2025-11-12",
    url: "https://www.nationalobserver.com/2025/11/11/opinion/carney-keystone-xl-us-trade",
    summary: "Keystone XL avoids friction between British Columbia and Alberta over a West Coast project that would never be built anyway.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2025/11/03/edit_50441585401_c80de0f95c_k.jpg",
    pull_quote: "No pipeline will be built, but that will be because of economics and the market, not Carney.",
  },
  {
    title: "The fall of a Canadian giant",
    date: "2025-10-06",
    url: "https://www.nationalobserver.com/2025/10/03/analysis/fall-canadian-giant-imperial-oil",
    summary: "The new Imperial Oil is essentially a collection of operating plants run out of \"global business centres\" — not run from Canada or by Canadians.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2025/10/03/edit_a096152-v8.jpg",
    pull_quote: "This isn't just a corporate restructuring. It's the clearest sign yet that Canada's century-and-a-half-long oil story is drawing to a close.",
  },
  {
    title: "A reality check on nation building",
    date: "2025-09-19",
    url: "https://www.nationalobserver.com/2025/09/19/opinion/oil-pipelines-nation-building-carney-smith",
    summary: "We can either stay hewers of wood and drawers of water, or finish the job and keep the refining profit in Canada.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2025/09/16/image_1.png",
    pull_quote: "We can either stay hewers of wood and drawers of water, or finish the job and keep the refining profit in Canada.",
  },
  {
    title: "Mark Carney and Danielle Smith — It's 2025, Not 1947",
    date: "2025-08-05",
    url: "https://www.nationalobserver.com/2025/07/31/opinion/mark-carney-danielle-smith-its-2025-not-1947",
    summary: "In the 1950s, the economy was the only concern — climate change wasn't yet on government's radar. That isn't the case in 2025.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2025/06/04/oilsands_shutterstock_1344602666_updated.jpg",
    pull_quote: "In the 1950s, the economy was the only concern — climate change wasn't yet on government's radar. That isn't the case in 2025, and our leaders should act accordingly.",
  },
  {
    title: "Mark Carney is reviving the oilsands discussion — and it's giving me whiplash",
    date: "2025-06-27",
    url: "https://www.nationalobserver.com/2025/06/27/opinion/getting-whiplash-mark-carney-oilsands-discussion",
    summary: "It's a fantasy that another pipeline will unlock new riches in the oilsands.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2025/06/26/cp174670888.JPG",
    pull_quote: "It's a fantasy that another pipeline will unlock new riches in the oilsands. But as long as the federal government doesn't pay for it, the industry is welcome to keep pining.",
  },
  {
    title: "Not Justin Trudeau? Prove It, Mark Carney — On Climate",
    date: "2025-05-09",
    url: "https://www.nationalobserver.com/2025/05/07/opinion/not-justin-trudeau-prove-it-mark-carney-climate",
    summary: "Canadians have been fed a steady diet of climate noise — photo-ops, grand announcements, and lofty targets — none of which have translated into serious emissions reductions.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2025/05/07/mark_carney_shutterstock_2609097007.jpg",
    pull_quote: "Canadians have been fed a steady diet of climate noise — photo-ops, grand announcements, and lofty targets — none of which have translated into serious emissions reductions.",
  },
  {
    title: "Politicians, stop the magical pipeline talk and do your job",
    date: "2025-03-04",
    url: "https://www.nationalobserver.com/2025/03/04/opinion/politicians-pipeline-oilsands-tariffs",
    summary: "Accept the reality there will not be another oilsands boom, and look for long-term opportunities.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2025/03/03/cno-deathspiral-1920x1080-02.21.jpg",
    pull_quote: "If we accept reality and stop talking about pipeline delusions to re-create an oilsands boom, then we can talk about opportunities that might exist long-term for this resource.",
  },
  {
    title: "When it comes to energy, the U.S. has Ontario over a barrel",
    date: "2024-12-19",
    url: "https://www.nationalobserver.com/2024/12/18/analysis/energy-us-ontario-Trump-Trudeau-tarriffs-electricity",
    summary: "Ontario has far more to lose if the U.S. slashes energy supplies to Canada, than the other way around.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2024/12/18/cp173694351.JPG",
    pull_quote: "The idea of using energy as a cudgel is unbelievably terrible for Ontario when we look at how energy is supplied to the province.",
  },
  {
    title: "The 'What about China?' excuse simply doesn't hold up",
    date: "2024-10-08",
    url: "https://www.nationalobserver.com/2024/10/08/opinion/china-excuse-electric-vehicles-transition-energy-solar",
    summary: "China is eating our lunch. They're running full speed toward the future while we're stuck in the past.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2024/10/07/cp166384033.jpg",
    pull_quote: "China is eating our lunch. We can debate about unfair competition or not, but they're running full speed toward the future while we're stuck in the past.",
  },
  {
    title: "Take it from Deloitte: Carbon capture is a terrible investment",
    date: "2024-06-26",
    url: "https://www.nationalobserver.com/2024/06/25/opinion/deloitte-carbon-capture-terrible-investment",
    summary: "Canada is about to see a massive drop in GDP as the world decarbonizes. And to pretend otherwise is sleepwalking over a cliff.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2024/06/25/49900068067_ea16c436a0_k.jpg",
    pull_quote: "Canada is about to see a massive drop in GDP as the world decarbonizes. And to pretend otherwise is sleepwalking over a cliff.",
  },
  {
    title: "Canada continues to pretend it's better than it really is",
    date: "2024-05-10",
    url: "https://www.nationalobserver.com/2024/05/10/opinion/canada-continues-pretend-its-better-it",
    summary: "The Canadian government has been making overblown promises about reducing emissions for decades.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2024/05/09/181204_-_ate_-_steven_guilbeault-5.jpg",
    pull_quote: "It's lucky Canada isn't a corporation or the Competition Bureau would have to investigate a series of our national governments.",
  },
  {
    title: "We have already reached post-peak oil",
    date: "2024-02-02",
    url: "https://www.nationalobserver.com/2024/02/02/opinion/demand-oil-market-Alberta-demand-energy-transition",
    summary: "No amount of money we invest in our oil and gas industry is going to reverse the decline.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2024/02/01/14505232912_04348d2036_c.jpg",
    pull_quote: "No amount of money we invest in our oil and gas industry is going to reverse the decline.",
  },
  {
    title: "Ontario's battery plants aren't as green as they seem",
    date: "2024-01-03",
    url: "https://www.nationalobserver.com/2024/01/02/opinion/ontario-battery-plants-greenhouse-gas-emissions-green-billions",
    summary: "Battery plants themselves are large GHG emitters, requiring fossil fuel burning and large amounts of electricity.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2024/01/02/cp167342665.jpg",
    pull_quote: "Battery plants themselves are large GHG emitters, requiring fossil fuel burning and large amounts of electricity.",
  },
  {
    title: "Trudeau is building a pipeline the world doesn't need",
    date: "2023-10-20",
    url: "https://www.nationalobserver.com/2023/10/20/opinion/trudeau-building-pipeline-world-doesnt-need",
    summary: "The Trans Mountain pipeline expansion project is destined to be a white elephant monstrosity built by our government.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2023/10/19/cp166759238.jpg",
    pull_quote: "The Trans Mountain pipeline expansion project is destined to be a white elephant monstrosity built by our government.",
  },
  {
    title: "A wasteful bet on a dying industry",
    date: "2023-06-12",
    url: "https://www.nationalobserver.com/2023/06/12/opinion/canada-wasteful-bet-dying-industry",
    summary: "By 2050, there will simply not be enough worldwide demand left for our poor-quality crude oil.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2023/06/08/6880023053_2aff40a2a7_k.jpg",
    pull_quote: "By 2050, there will simply not be enough worldwide demand left for our poor-quality crude oil.",
  },
  {
    title: "Ontario and Alberta are Canada's top clean energy foot-draggers",
    date: "2023-03-03",
    url: "https://www.nationalobserver.com/2023/03/03/opinion/ontario-alberta-canada-top-clean-energy-foot-draggers",
    summary: "Don't just point climate fingers at Alberta. Ontario made up 22 per cent of our national emissions in 2019 and has no plan to improve by 2030.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2023/03/01/180416_-_ate_-_doug_ford-11.jpg",
    pull_quote: "Don't just point climate fingers at Alberta. Ontario made up 22 per cent of our national emissions in 2019 and according to the province's auditor general, has no plan to improve by 2030.",
  },
  {
    title: "Trudeau's fossil fuel failures — real and imagined",
    date: "2022-10-06",
    url: "https://www.nationalobserver.com/2022/10/06/opinion/trudeau-fossil-fuel-failures-real-and-imagined",
    summary: "The Trudeau government is pushing the \"Norway model\" and greening our economy while raking in oil and gas revenue.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2022/10/05/171220_-_ate_-_justin_trudeau-7.jpg",
    pull_quote: "The Trudeau government is pushing the \"Norway model\" and greening our economy while raking in oil and gas revenue.",
  },
  {
    title: "PM Trudeau, time to show us your cards",
    date: "2022-07-25",
    url: "https://www.nationalobserver.com/2022/07/25/opinion/pm-justin-trudeau-show-us-your-cards",
    summary: "Canada's proposed cap on oil and gas emissions raises questions about the future of refineries and the Line 5 pipeline.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2022/07/25/untitled-1_2_2_2_2_2_2.jpeg",
    pull_quote: "Canada's proposed cap on oil and gas emissions raises questions about the future of refineries and the Line 5 pipeline.",
  },
  {
    title: "Canada's carbon hypocrisy",
    date: "2022-03-02",
    url: "https://www.nationalobserver.com/2022/03/02/opinion/canadas-carbon-hypocrisy",
    summary: "When we say net-zero, we should truly mean net-zero.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2022/03/01/6860868769_764c80f83a_k.jpg",
    pull_quote: "When we say net-zero, we should truly mean net-zero.",
  },
  {
    title: "Make provinces pay for their emissions",
    date: "2021-10-28",
    url: "https://www.nationalobserver.com/2021/10/28/opinion/make-provinces-pay-their-emissions",
    summary: "Close to 50 per cent of our national emissions are produced by Alberta and Saskatchewan.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2021/10/27/568a0640.jpg",
    pull_quote: "Close to 50 per cent of our national emissions are produced by Alberta and Saskatchewan.",
  },
  {
    title: "What carbon activists can learn from the campaign to end asbestos production in Canada",
    date: "2021-08-05",
    url: "https://www.nationalobserver.com/2021/08/05/opinion/what-carbon-activists-can-learn-campaign-end-asbestos-production",
    summary: "Many groups soft-pedal the real problem with fossil fuel production — the end use of the product.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2021/08/04/08052021-asbestosmine-flickr.jpg",
    pull_quote: "One of the difficulties of trying to stop fossil fuel production in Canada is many groups soft-pedal the real problem — the end use of the product.",
  },
  {
    title: "Trudeau's ambitious new climate target is unreachable",
    date: "2021-04-26",
    url: "https://www.nationalobserver.com/2021/04/26/opinion/trudeaus-ambitious-new-climate-target-unreachable",
    summary: "We aren't the U.S., and implementing their solutions doesn't get us as far.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2021/04/23/200318_justintrudeau_rideaucottage_0027_1.jpeg",
    pull_quote: "We aren't the U.S., and implementing their solutions doesn't get us as far.",
  },
  {
    title: "Sorry, Canada. The world doesn't need Keystone XL",
    date: "2021-01-25",
    url: "https://www.nationalobserver.com/2021/01/25/opinion/canada-doesnt-need-keystone-xl-pipeline",
    summary: "There is more than enough oil to go around without the TC Energy Corp. pipeline project.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2021/01/22/01222021-albertagovernment-keystone.jpg",
    pull_quote: "There is more than enough oil to go around without the TC Energy Corp. pipeline project.",
  },
  {
    title: "Letter to the Editor: Stop peddling the pipeline fantasy",
    date: "2019-11-26",
    url: "https://www.nationalobserver.com/2019/11/26/opinion/letter-editor-stop-peddling-pipeline-fantasy",
    summary: "On the persistent myth that new pipelines will revive the oilsands.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2019/11/26/190502-ame-jason_kenney-justin_trudeau.jpg",
    pull_quote: null,
  },
  {
    title: "The myth of the anti-Alberta Liberal",
    date: "2019-05-17",
    url: "https://www.nationalobserver.com/2019/05/17/opinion/myth-anti-alberta-liberal",
    summary: "We may not have a national mythology like the Americans, but we do have a myth based on the refrain that 'Ottawa Liberals hate Alberta.'",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2019/05/17/190502-am-kenney-trudeau.jpg",
    pull_quote: "Oh, Canada. We may not have a national mythology built on a phrase like the American 'Life, liberty and the pursuit of Happiness,' but we do have a myth based on the refrain that 'Ottawa Liberals hate Alberta.'",
  },
  {
    title: "Belot: Albertans have been fooled by a myth about pipelines and the oilsands",
    date: "2019-04-23",
    url: "https://www.nationalobserver.com/2019/04/23/opinion/belot-albertans-have-been-fooled-myth-about-pipelines-and-oilsands",
    summary: "The oilsands golden years lasted about a decade, and they will never come back. Blaming that on a lack of pipelines just perpetuates a myth.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2018/07/04/180507_-_ate_-_jason_kenney-5.jpg",
    pull_quote: "The oilsands golden years lasted about a decade, and they will never come back. Blaming that on a lack of pipelines just perpetuates a myth.",
  },
  {
    title: "Sloughing off the costs of environmental damage",
    date: "2019-04-03",
    url: "https://www.nationalobserver.com/2019/04/03/opinion/sloughing-costs-environmental-damage",
    summary: "In Alberta and other fossil fuel production jurisdictions there is a whole lot of externalizing going on.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2018/07/13/180415_-_ate_-_rachel_notley-3.jpg",
    pull_quote: "In Alberta and other fossil fuel production jurisdictions there is a whole lot of externalizing going on.",
  },
  {
    title: "How Trudeau's climate promise fizzled",
    date: "2019-02-14",
    url: "https://www.nationalobserver.com/2019/02/14/opinion/how-trudeaus-climate-promise-fizzled",
    summary: "Some voters had a lot of hope for the federal Liberals back in 2015. Confronting climate change was one of the big promises.",
    thumbnail_url: "https://www.nationalobserver.com/sites/default/files/img/2018/04/24/180415_-_ate_-_justin_trudeau-6.jpg",
    pull_quote: "Some voters had a lot of hope for the federal Liberals back in 2015. First of all, Justin Trudeau was not Stephen Harper.",
  },
];

// ─── Standalone Articles ──────────────────────────────────────────────────────

const standaloneArticles = [
  {
    publication: "Maclean's",
    title: "Why Canada's Oil Sands Aren't Coming Back",
    date: "2025-02-14",
    url: "https://macleans.ca/economy/why-canadas-oil-sands-arent-coming-back/",
    summary: "I used to be an oil executive. Here's how market forces, not politics, killed the oil boom.",
    thumbnail_url: "https://macleans.mblycdn.com/mac/resized/2025/02/1200x630/iStock-468847418-scaled.jpg",
    pull_quote: null,
  },
  {
    publication: "Policy Magazine",
    title: "How Shifts in Global Markets Should Shape Canada's Energy Strategy",
    date: "2015-03-01",
    url: "https://policymagazine.ca/pdf/12/PolicyMagazineMarchApril-2015-McCollBelot.pdf",
    summary: "Co-authored with Velma McColl. As provincial and territorial premiers prepare to announce a pan-Canadian energy strategy, McColl and Belot examine how global trade flows suggest we need more than pipelines and infrastructure to maximize returns from our raw resources.",
    thumbnail_url: null,
    pull_quote: "A robust Canadian energy strategy will look to the future and capitalize on our diverse energy assets, clean technologies and services in a dynamic North American and global marketplace.",
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

console.log("Seeding op-eds…\n");

// 1. Get or create National Observer collection
const existingCollections = await sql`
  SELECT id, publication FROM op_ed_collections WHERE slug = 'national-observer'
`;

let noCollectionId;
if (existingCollections.length === 0) {
  console.log("Creating National Observer collection…");
  const [created] = await sql`
    INSERT INTO op_ed_collections (publication, slug, masthead_url, description, display_order)
    VALUES (
      'Canada''s National Observer',
      'national-observer',
      '/mastheads/national-observer.svg',
      'Opinion and analysis on energy, climate, and the environment.',
      0
    )
    RETURNING id
  `;
  noCollectionId = created.id;
  console.log(`  Created collection id=${noCollectionId}\n`);
} else {
  noCollectionId = existingCollections[0].id;
  console.log(`  National Observer collection exists (id=${noCollectionId})\n`);
}

// 2. Collect existing URLs to skip duplicates
const existingRows = await sql`SELECT url FROM op_eds`;
const existingUrls = new Set(existingRows.map((r) => r.url));

// 3. Insert National Observer articles
let inserted = 0;
for (const article of nationalObserverArticles) {
  if (existingUrls.has(article.url)) {
    console.log(`  SKIP (exists): ${article.title.substring(0, 55)}…`);
    continue;
  }
  await sql`
    INSERT INTO op_eds (collection_id, publication, title, url, date, summary, pull_quote, thumbnail_url, display_order)
    VALUES (
      ${noCollectionId},
      'Canada''s National Observer',
      ${article.title},
      ${article.url},
      ${article.date},
      ${article.summary},
      ${article.pull_quote},
      ${article.thumbnail_url},
      0
    )
  `;
  inserted++;
  console.log(`  + ${article.title.substring(0, 60)}`);
}
console.log(`\n  Inserted ${inserted} National Observer articles.\n`);

// 4. Insert standalone articles
for (const article of standaloneArticles) {
  if (existingUrls.has(article.url)) {
    console.log(`  SKIP (exists): ${article.title}`);
    continue;
  }
  await sql`
    INSERT INTO op_eds (collection_id, publication, title, url, date, summary, pull_quote, thumbnail_url, display_order)
    VALUES (
      NULL,
      ${article.publication},
      ${article.title},
      ${article.url},
      ${article.date},
      ${article.summary},
      ${article.pull_quote},
      ${article.thumbnail_url},
      0
    )
  `;
  console.log(`  + [standalone] ${article.title}`);
}

console.log("\nDone!");
