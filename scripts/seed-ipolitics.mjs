/**
 * Seed iPolitics op-eds into the database.
 *
 * Run: node scripts/seed-ipolitics.mjs
 *
 * Idempotent — skips articles already present by URL.
 * Creates the iPolitics collection if it does not exist.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { config } = await import("dotenv");
config({ path: path.resolve(__dirname, "../.env.local") });

const { neon } = await import("@neondatabase/serverless");

const dbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("ERROR: DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

// 56 articles extracted from iPolitics .webarchive files
const ipoliticsArticles = [
  {
    title: "Out of gas: If the Paris accord survives, the oilsands sector is doomed",
    date: "2016-02-19",
    url: "https://ipolitics.ca/2016/02/18/out-of-gas-if-the-paris-accord-survives-the-oilsands-sector-is-doomed/",
    summary: "We saw the delegates hugging each other as they walked out of the COP21 climate change talks in Paris back in December — but we had no idea what the agreement they reached meant for Canada.\n\nNow we do. And it turns out Saskatchewan Premier Brad Wall was quite right to be anxious about the future of our fossil fuel industry and Alberta Premier Rachel Notley may have been quite wrong in her assertion that Alberta will prosper — if she was talking about the oil and gas industry, at any rate.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/02/DEA4183.jpg",
    pull_quote: "We saw the delegates hugging each other as they walked out of the COP21 climate change talks in Paris back in December — but we had no idea what the agreement they reached meant for Canada.",
  },
  {
    title: "Cutting GHG emissions by 30 per cent isn't impossible — just very, very hard",
    date: "2016-03-01",
    url: "https://ipolitics.ca/2016/02/29/cutting-ghg-emissions-by-30-per-cent-isnt-impossible-just-very-very-hard/",
    summary: "Just before the COP21 climate conference in Paris got started, federal Minister of Environment and Climate Change Catherine McKenna vowed that the Harper government’s target of a 30 per cent reduction from 2005 levels in greenhouse gas (GHG) output by 2030 would be the “floor” for Canada’s efforts — that we would, if possible, do better.\n\nOn Thursday, Prime Minister Justin Trudeau sits down with the premiers to talk about the followup to Paris COP21. By now, he should have a clear idea of how very hard it will be to reach the commitment McKenna made in Paris — assuming that commitment was seen as achievable, rather than merely aspirational.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2015/11/10065475.jpg",
    pull_quote: "Just before the COP21 climate conference in Paris got started, federal Minister of Environment and Climate Change Catherine McKenna vowed that the Harper government’s target of a 30 per cent reduction from 2005 levels in greenhouse gas (GHG) output by 2030 would be the “floor” for Canada’s efforts — that we would, if possible, do better.",
  },
  {
    title: "The business case for Energy East just fell apart",
    date: "2016-03-02",
    url: "https://ipolitics.ca/2016/03/01/the-business-case-for-energy-east-just-fell-apart/",
    summary: "If you were a Canadian oil producer in 2013, Energy East looked like a brilliant idea: converting an underutilized natural gas line into an oil pipeline with a capacity of 1.1 million barrels per day, running straight through Canada to markets that aren’t served by Canadian oil. Back then, you’ll remember, Canadian crude was selling …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/03/10918685.jpg",
    pull_quote: "If you were a Canadian oil producer in 2013, Energy East looked like a brilliant idea: converting an underutilized natural gas line into an oil pipeline with a capacity of 1.1 million barrels per day, running straight through Canada to markets that aren’t served by Canadian oil.",
  },
  {
    title: "Christy Clark's LNG pipe dream is falling apart",
    date: "2016-03-11",
    url: "https://ipolitics.ca/2016/03/11/christy-clarks-lng-pipe-dream-is-falling-apart/",
    summary: "“It’s good for the world,\" Harvard economist Dr. Michael E. Porter told the Globe 2016 conference on sustainable development in Vancouver last week. \"It’s good for China. It’s good for lots of other people in the world who really care about climate. We should be exporting (it) as much as possible.”",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/03/06385555.jpg",
    pull_quote: "“It’s good for the world,”Harvard economist Dr. Michael E. Porter told the Globe 2016 conference on sustainable development in Vancouver last week. “It’s good for China. It’s good for lots of other people in the world who really care about climate. We should be exporting (it) as much as possible.”",
  },
  {
    title: "Are we sure B.C.'s carbon tax is working?",
    date: "2016-03-25",
    url: "https://ipolitics.ca/2016/03/25/are-we-sure-b-c-s-carbon-tax-is-working/",
    summary: "B.C.’s carbon tax has been hailed as a great success. The New York Times recently ran a piece on B.C.'s carbon tax arguing that it \"basically worked as advertised.\" A recent study showed the tax having an extraordinary impact on gasoline consumption, a 11 to 17 per cent shift in gasoline demand from a 7-cent-per-litre carbon tax.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/03/shutterstock_159025379.jpg",
    pull_quote: "B.C.’s carbon tax has been hailed as a great success. TheNew York Timesrecently ran a piece on the tax arguing that it“basically worked as advertised.”A recent study showed the tax having an extraordinary impact on gasoline consumption,a 11 to 17 per cent shift in gasoline demandfrom a 7-cent-per-litre carbon tax.",
  },
  {
    title: "Build a dozen pipelines, Alberta. It won't help.",
    date: "2016-04-12",
    url: "https://ipolitics.ca/2016/04/11/build-a-dozen-pipelines-alberta-it-wont-help/",
    summary: "\"I won’t let up,\" Alberta Premier Rachel Notley told delegates to the NDP's national convention last week. \"We must get to ‘yes’ on a pipeline.” She repeated that message Saturday, asking the convention to support “pipelines to tidewater that allow us to diversify our markets.\"",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/04/11273625.jpg",
    pull_quote: "“I won’t let up,” Alberta Premier Rachel Notley told delegates to the NDP’s national convention last week. “We must get to ‘yes’ on a pipeline.” She repeated that message Saturday, asking the convention to support “pipelines to tidewater that allow us to diversify our markets.”",
  },
  {
    title: "Face facts, Mr. Trudeau: Pipelines and the Paris accord don't mix",
    date: "2016-04-26",
    url: "https://ipolitics.ca/2016/04/25/face-facts-mr-trudeau-pipelines-and-the-paris-accord-dont-mix/",
    summary: "\"As I say to business, 'You're crazy if you're not thinking about this. If you're in oil and gas you should be thinking about renewables. That's a huge opportunity for you, for your shareholders.”\n\nThat’s federal Environment Minister Catherine McKenna, speaking at a World Bank event in Washington a couple of weeks ago.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/04/GMAC3035.jpg",
    pull_quote: "“As I say to business, ‘You’re crazy if you’re not thinking about this. If you’re in oil and gas you should be thinking about renewables. That’s a huge opportunity for you, for your shareholders.”",
  },
  {
    title: "The fight to kill Keystone XL was a huge waste of time",
    date: "2016-05-03",
    url: "https://ipolitics.ca/2016/05/02/the-fight-to-kill-keystone-xl-was-a-colossal-waste-of-time/",
    summary: "Like a political reboot of the old Jekyll and Hyde yarn, Prime Minister Justin Trudeau seems to be trying to convince Canadians he can be a carbon warrior and a pipeline cheerleader at the same time. He's not the only politician talking out of both sides of his mouth on the climate file, of course; in fact, schizophrenia seems to be the house style when it comes to the collision between politics and the environment.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/05/MAY3808.jpg",
    pull_quote: "Like a political reboot of the old Jekyll and Hyde yarn, Prime Minister Justin Trudeau seems to be trying to convince Canadians he can be a carbon warrioranda pipeline cheerleader at the same time. He’s not the only politician talking out of both sides of his mouth on the climate file, of course; in fact, split-personality seems to be the house style when it comes to the collision between politics and the environment.",
  },
  {
    title: "Ontario's climate plan could change everything — if politicians don't blink first",
    date: "2016-05-13",
    url: "https://ipolitics.ca/2016/05/12/does-ontario-have-the-nerve-to-get-serious-about-climate-change/",
    summary: "Ontario has made at least one, big move on climate change. Unfortunately, the big move amounted to jogging on a treadmill — running to stay in the same place.\n\nThe province is one of the few jurisdictions in the world to abandon coal completely for electricity generation. That led to a drop in emissions of 8 per cent between 1990 and 2013 — which was completely offset by a spike in emissions from cars and trucks over the same period.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/05/Wind-Turbine-at-Sunset.jpg",
    pull_quote: "Ontario has made at least one, big move on climate change. Unfortunately, the big move amounted to jogging on a treadmill — running to stay in the same place.",
  },
  {
    title: "Alberta's do-little climate plan",
    date: "2016-05-31",
    url: "https://ipolitics.ca/2016/05/30/albertas-do-little-climate-plan/",
    summary: "There's a trick managers are taught to help them goad lazy employees into getting work done: praising them for doing what's expected of them. You showed up to work on time, wearing clothing? Good job.\n\nApply this logic to the arena of climate change policy in Canada, and you're obliged to celebrate the Alberta government’s new climate strategy. So thanks, Alberta — something is always better than nothing, which is what you were mostly doing up to now.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/02/10622884.jpg",
    pull_quote: "There’s a trick managers are taught to help them goad lazy employees into getting work done: praising them for doing what’s expected of them.You showed up to work on time, wearing clothing? Good job.",
  },
  {
    title: "Sticking our heads in the (oil)sands",
    date: "2016-06-07",
    url: "https://ipolitics.ca/2016/06/06/sticking-our-heads-in-the-oilsands/",
    summary: "Take a look at this Scientific American article, published in 1895. It's all about how the market for horses and carriages took a nosedive as the century was turning.\n\nWhat's amazing about it is how it tracks a major reversal of fortune. Up until that point, the western world’s major cities were struggling with what amounted to an environmental crisis because they had too many horses — and too much of what horses leave behind. (In 1880, New York and Brooklyn were cleaning up between three and four million pounds of manure per day.)",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/06/shutterstock_295357133.jpg",
    pull_quote: "Take a look at this Scientific American article, published in 1895. It’s all about how the market for horses and carriages took a nosedive as the century was turning.",
  },
  {
    title: "Our pointless pipeline debate",
    date: "2016-06-17",
    url: "https://ipolitics.ca/2016/06/17/our-pointless-pipeline-debate/",
    summary: "For decades, natural gas has been a core element of Canada’s resource landscape. Like most Canadian resource stories, it came with controversy — the Pipeline Debate of 1956.\n\nThe grand vision of the St. Laurent Liberal government was the Transcanada pipeline system — 14,000 kilometres of pipe linking Alberta to Central Canada. The idea was to replace Ontario and Quebec fuel refined from foreign oil with Canadian-produced natural gas.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/06/shutterstock_141093514.jpg",
    pull_quote: "For decades, natural gas has been a core element of Canada’s resource landscape. Like most Canadian resource stories, it came with controversy —the Pipeline Debate of 1956.",
  },
  {
    title: "The Site C dam: Drowning good money after bad",
    date: "2016-07-08",
    url: "https://ipolitics.ca/2016/07/08/the-site-c-dam-drowning-good-money-after-bad/",
    summary: "We’ve all read about how the Chinese are building a new coal burning electrical generating station roughly every week — a fact often cited by opponents of climate change action here in Canada as an excuse to do nothing. The Chinese are doing half of the world’s coal-burning already — if they're going to carry on polluting the planet, why should we worry about Canada’s measly 2 per cent share of of the world’s greenhouse gases (GHG)?",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/07/shutterstock_358089791.jpg",
    pull_quote: "We’ve all read about howthe Chinese are building a new coal burning electrical generating station roughly every week— a fact often cited by opponents of climate change action here in Canada as an excuse to do nothing. The Chinese are doing half of the world’s coal-burning already — if they’re going to carry on polluting the planet, why should we worry about Canada’s measly 2 per cent share of of the world’s greenhouse gases (GHG)?",
  },
  {
    title: "The case for new pipelines is built on bad data",
    date: "2016-07-20",
    url: "https://ipolitics.ca/2016/07/19/the-case-for-new-pipelines-is-built-on-bad-data/",
    summary: "“We’re working hard to get this done the right way because that’s what Canadians expect.” That’s Prime Minister Justin Trudeau speaking at the Calgary Stampede last week about his government’s management of the pipeline question.\n\nBut when it comes to Energy East and other proposed pipeline projects, we’ve seen a parade of headlines lately that do little but sow confusion — hardly what Canadians expect, hardly the \"right way.\"",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/07/shutterstock_159467552.jpg",
    pull_quote: "“We’re working hard to get this done the right way because that’s what Canadians expect.”That’s Prime Minister Justin Trudeauspeaking at the Calgary Stampede last week about his government’s management of the pipeline question.",
  },
  {
    title: "The shipping news: New fuel standards could cripple eastern refineries",
    date: "2016-08-12",
    url: "https://ipolitics.ca/2016/08/11/the-shipping-news-new-fuel-standards-could-cripple-eastern-refineries/",
    summary: "Everybody knows Canada's energy sector has a big problem: getting bitumen to tidewater in the face of a political climate hostile to both pipelines and inshore tanker traffic. But there's another environmental issue on the global agenda that could have serious market repercussions for some Canadian players.\n\nIn October, the International Marine Organization (IMO), an agency of the UN that regulates global marine shipping, will make a decision on dropping the maximum sulphur limit on fuel used in ocean-going ships from 35,000 to 5,000 parts per million (ppm). The question isn't whether this drop will happen, but when — in 2020 or 2025.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/08/12103000.jpg",
    pull_quote: "Everybody knows Canada’s energy sector has a big problem: getting bitumen to tidewater in the face of a political climate hostile to both pipelines and inshore tanker traffic. But there’s another environmental issue on the global agenda that could have serious market repercussions for some Canadian players.",
  },
  {
    title: "Garbage in, garbage out: Canada's big data problem",
    date: "2016-08-23",
    url: "https://ipolitics.ca/2016/08/22/garbage-in-garbage-out-canadas-big-data-problem/",
    summary: "In a recent article in the Toronto Star, Paul Wells lays out what he sees as Prime Minister Trudeau's game plan for slowing Canada's brain drain and making science pay. “Over the next year,\" he writes, \"the Trudeau government will seek to reinforce or shore up Canada’s advantage in three emerging fields: quantum tech, artificial intelligence and big data and analytics.”\n\nAs he should. If that's the plan, it's a good one. Canada's future prosperity depends on our ability to innovate and retain the best talent in those three fields.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/08/shutterstock_2592381.jpg",
    pull_quote: "In a recent article in theToronto Star, Paul Wells lays out what he sees as Prime Minister Trudeau’s game plan for slowing Canada’s brain drain and making science pay. “Over the next year,” he writes, “the Trudeau government will seek to reinforce or shore up Canada’s advantage in three emerging fields: quantum tech, artificial intelligence and big data and analytics.”",
  },
  {
    title: "Post-Paris, we're still blowing smoke on climate change",
    date: "2016-09-09",
    url: "https://ipolitics.ca/2016/09/08/post-paris-were-still-blowing-smoke-on-climate-change/",
    summary: "A portent of Canada’s delay in ratifying the Paris climate agreement emerged earlier this summer in the form of a decision on what kind of car Natural Resources Minister Jim Carr would use as his ministerial limousine.\n\nThe Trudeau government has said that, as part of its commitment to climate change action, it was committed to shifting the government’s fleet of vehicles towards zero emission electric vehicles (EVs).",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/09/11397245.jpg",
    pull_quote: "A portent of Canada’sdelay in ratifying the Paris climate agreementemerged earlier this summer in the form of a decision on what kind of car Natural Resources Minister Jim Carr would use as his ministerial limousine.",
  },
  {
    title: "You can stop playing eco-warrior now, Trudeau",
    date: "2016-09-29",
    url: "https://ipolitics.ca/2016/09/28/you-can-stop-playing-eco-warrior-now-trudeau/",
    summary: "It all started so well. There was that letter from Prime Minister Trudeau stating that he was adding the words \"climate change\" to the Ministry of the Environment's title to point to “the economic cost and catastrophic impact that a greater-than-two-degree increase in average global temperatures would represent, as well as the need for Canada to do its part to prevent that from happening.\"",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/09/12721718.jpg",
    pull_quote: "It all started so well. There wasthat letter from Prime Minister Trudeaustating that he was adding the words “climate change” to the Ministry of the Environment’s title to point to “the economic cost and catastrophic impact that a greater-than-two-degree increase in average global temperatures would represent, as well as the need for Canada to do its part to prevent that from happening.”",
  },
  {
    title: "Trudeau's carbon plan: separating fact from fantasy",
    date: "2016-10-04",
    url: "https://ipolitics.ca/2016/10/04/trudeaus-carbon-plan-separating-fact-from-fantasy/",
    summary: "When was the last time something so modest managed to inspire so much panic? Saskatchewan Premier Brad Wall insists that — somehow — a $50/tonne carbon tax would cost the average family around $1,250 per year and that Prime Minister Trudeau's policy amounts to a “betrayal”.\n\nWell ... no. Premier Wall is only exaggerating a lot. Today’s $30 per tonne carbon tax in B.C. is estimated to cost the average household there $125 per year; the tax's revenue-neutral component means they get at least that much back on average, so it costs the average household nothing. So Brad Wall and other opponents of carbon pricing should stop screaming about the sky falling and get some perspective.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/10/13115054-e1475766634424.jpg",
    pull_quote: "When was the last time something so modest managed to inspire so much panic? Saskatchewan Premier Brad Wall insists that — somehow — a $50/tonne carbon tax would cost the average family around $1,250 per year and that Prime Minister Trudeau’s policyamounts to a “betrayal”.",
  },
  {
    title: "Stats, lies and crude oil",
    date: "2016-10-20",
    url: "https://ipolitics.ca/2016/10/19/stats-lies-and-crude-oil/",
    summary: "Canadians love their energy myths. Pierre Trudeau destroyed the Alberta oil industry in the 1980s with the NEP (it had marginal effects — the real cause was a global recession and global crude price collapse). Ontario’s electricity costs are way out of line with our U.S. neighbours (actually, they're much lower). The oilsands need a pipeline because our oil is so deeply discounted (it isn’t).",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/02/10763758.jpg",
    pull_quote: "Canadians love their energy myths. Pierre Trudeau destroyed the Alberta oil industry in the 1980s with the NEP (it had marginal effects — the real cause was a global recession and global crude price collapse). Ontario’s electricity costs are way out of line with our U.S. neighbours (actually,they’re much lower). The oilsands need a pipeline because our oil is so deeply discounted (it isn’t).",
  },
  {
    title: "The case for pipelines is built on politics — and wishful thinking",
    date: "2016-10-27",
    url: "https://ipolitics.ca/2016/10/26/the-case-for-pipelines-is-built-on-politics-and-wishful-thinking/",
    summary: "In a piece I wrote last week for iPolitics, I drilled into the numbers behind National Energy Board CEO Peter Watson’s testimony to the Senate Standing Committee on Transportation and Communication. I criticized his testimony for putting forth what I called a \"scary\" and \"unrealistic\" oil-by-rail scenario that was based on an oil price forecast far higher than the prices we're likely to see.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/09/shutterstock_391966078.jpg",
    pull_quote: "In a piece I wrote last week foriPolitics,I drilled into the numbers behind National Energy Board CEO Peter Watson’s testimony to the Senate Standing Committee on Transportation and Communication. I criticized his testimony for putting forth what I called a “scary” and “unrealistic” oil-by-rail scenario that was based on an oil price forecast far higher than the prices we’re likely to see.",
  },
  {
    title: "McKenna's going to COP 22 with nothing to brag about",
    date: "2016-11-02",
    url: "https://ipolitics.ca/2016/11/01/mckennas-going-to-marrakech-with-nothing-to-brag-about/",
    summary: "When your staff starts trying to shield you from your critics, you’ve got a problem. Last week we learned that staff in the Ministry of Environment sent out letters to those invited to be part of the Canadian delegation to the COP 22 climate change conference in in Marrakech — letters which, among other things, …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/04/Apr.120021.jpg",
    pull_quote: "When your staff starts trying to shield you from your critics, you’ve got a problem. Last week we learned that staff in the Ministry of Environment sent out letters to those invited to be part of the Canadian delegation to the COP 22 climate change conference in in Marrakech — letters which, among other things, amounted to a muzzle.",
  },
  {
    title: "Does Trump make Trudeau's pipeline problem better, or worse?",
    date: "2016-11-15",
    url: "https://ipolitics.ca/2016/11/14/does-trump-make-trudeaus-pipeline-problem-better-or-worse/",
    summary: "A thought experiment: Say you're Prime Minister Justin Trudeau, You're trying to figure out how to approve the Kinder-Morgan Transmountain pipeline expansion with minimal political fallout. You’ve promised a Go/No Go decision by Decemeber 19. You convened a special panel to help consult with Canadians to fill the gaps in a controversial NEB review of the project, hoping to build consensus.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/09/12976847.jpg",
    pull_quote: "A thought experiment: Say you’re Prime Minister Justin Trudeau, You’re trying to figure out how to approve the Kinder Morgan Transmountain pipeline expansion with minimal political fallout. You’ve promised a Go/No Go decision by Decemeber 19. You convened a special panel to help consult with Canadians to fill the gaps in a controversial NEB review of the project, hoping to build consensus.",
  },
  {
    title: "Trudeau says we need Trans Mountain. What if he's wrong?",
    date: "2016-12-01",
    url: "https://ipolitics.ca/2016/11/30/trudeau-says-we-need-trans-mountain-what-if-hes-wrong/",
    summary: "Prime Minister Justin Trudeau just threw his B.C caucus under the bus, and maybe more MPs in ridings elsewhere.\n\nNobody was really surprised by his announcement Tuesday of cabinet approval for the Trans Mountain and Line 3 pipeline projects; we’ve been hearing for months that Trans Mountain was the project he wanted. But the reasons he offered Tuesday to justify that decision seemed to be speaking to widely held impressions that aren’t supported by analysis.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/11/Nov.291074.jpg",
    pull_quote: "Prime Minister Justin Trudeau just threw his B.C caucus under the bus, and maybe more MPs in ridings elsewhere.",
  },
  {
    title: "The cost of subsidizing the oilpatch is about to go up",
    date: "2017-01-13",
    url: "https://ipolitics.ca/2017/01/13/the-cost-of-subsidizing-the-oilpatch-is-about-to-go-up/",
    summary: "“We will end the cycle of federal parties — of all stripes — setting arbitrary targets without a real federal/provincial/territorial plan in place.”\n\nThat’s from the Liberal party’s election platform on climate change.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/04/10096252.jpg",
    pull_quote: "“We will end the cycle of federal parties — of all stripes — setting arbitrary targets without a real federal/provincial/territorial plan in place.”",
  },
  {
    title: "Trudeau told the truth about the oilsands — and got trashed for it",
    date: "2017-01-27",
    url: "https://ipolitics.ca/2017/01/27/trudeau-told-the-truth-about-the-oilsands-and-got-trashed-for-it/",
    summary: "\"You can't make a choice between what's good for the environment and what's good for the economy,\" Trudeau told a town hall meeting in Peterborough, Ont., earlier this month. \"We can't shut down the oilsands tomorrow. We need to phase them out. We need to manage the transition off of our dependence on fossil fuels. That is going to take time. And, in the meantime, we have to manage that transition.”",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/01/14272602.jpg",
    pull_quote: "“You can’t make a choice between what’s good for the environment and what’s good for the economy,” Trudeau told a town hall meeting in Peterborough, Ont.,earlier this month.“We can’t shut down the oilsands tomorrow. We need to phase them out. We need to manage the transition off of our dependence on fossil fuels. That is going to take time. And, in the meantime, we have to manage that transition.”",
  },
  {
    title: "Trump, trade and oil — and the man behind the curtain",
    date: "2017-02-09",
    url: "https://ipolitics.ca/2017/02/08/trump-trade-and-oil-and-the-man-behind-the-curtain/",
    summary: "Prime Minister Justin Trudeau and President Donald Trump will have a lot to discuss in their upcoming meeting: NAFTA, NATO, immigration, refugees, climate change. They might even discuss their experiences managing campaign promises they made when they still expected to lose — something they seem to have in common.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/11/13510064.jpg",
    pull_quote: "Prime Minister Justin Trudeau and President Donald Trump will have a lot to discuss in their upcoming meeting: NAFTA, NATO, immigration, refugees, climate change. They might even discuss their experiences managing campaign promises they made when they still expected to lose — something they seem to have in common.",
  },
  {
    title: "Rachel Notley needs to stop begging for more pipelines now",
    date: "2017-03-03",
    url: "https://ipolitics.ca/2017/03/03/rachel-notley-needs-to-stop-begging-for-more-pipelines-now/",
    summary: "“In this world,\" says a character in one of Oscar Wilde's plays, \"there are only two tragedies. One is not getting what one wants, and the other is getting it. The last is much the worst.”",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/11/13715863.jpg",
    pull_quote: "“In this world,” says a character in one of Oscar Wilde’s plays, “there are only two tragedies. One is not getting what one wants, and the other is getting it. The last is much the worst.”",
  },
  {
    title: "Trump's basing his pipeline policy on fantasy — and he's not alone",
    date: "2017-03-28",
    url: "https://ipolitics.ca/2017/03/27/trumps-basing-his-pipeline-policy-on-fantasy-and-hes-not-alone/",
    summary: "How is the Republicans' infatuation with Keystone XL like their hatred of Obamacare? Both are easy things to take hardline positions on in the phoney-baloney world of political opposition — and both start to look a lot different when it comes time to actually govern.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/02/14503534.jpg",
    pull_quote: "How is the Republicans’ infatuation with Keystone XL like their hatred of Obamacare? Both are easy things to take hardline positions on in the phoney-baloney world of political opposition — and both start to look a lot different when it comes time to actually govern.",
  },
  {
    title: "What environmentalists don't get about Trudeau's hypocrisy",
    date: "2017-04-25",
    url: "https://ipolitics.ca/2017/04/24/what-some-environmentalists-dont-get-about-trudeaus-hypocrisy/",
    summary: "Hardcore environmentalist Bill McKibben touched off a tire fire in green circles last week by arguing in The Guardian that Prime Minister Justin Trudeau may be as great a threat to the planet's health as the climate-change-denying, coal-loving president of the United States.",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/04/Apr.2103597.jpg",
    pull_quote: "Hardcore environmentalist Bill McKibbentouched off a tire fire in green circleslast week by arguing inThe Guardianthat Prime Minister Justin Trudeau may be as great a threat to the planet’s health as the climate-change-denying, coal-loving president of the United States.",
  },
  {
    title: "When facts fail you: Trudeau and Trans Mountain",
    date: "2017-06-08",
    url: "https://ipolitics.ca/2017/06/07/when-facts-fail-you-trudeau-and-trans-mountain/",
    summary: "“While the government in B.C. may change, the facts, the science, the evidence, the environmental considerations, the economic benefits, and the jobs all remain unchanged,” Natural Resource Minister Jim Carr told Parliament last week in support of Conservative Mark Strahl’s motion on the Trans Mountain pipeline expansion project, voted on yesterday. The Trudeau government loves …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/02/13933405.jpg",
    pull_quote: "“While the government in B.C. may change, the facts, the science, the evidence, the environmental considerations, the economic benefits, and the jobs all remain unchanged,” Natural Resource Minister Jim Carr told Parliament last week in support of Conservative Mark Strahl’s motion on the Trans Mountain pipeline expansion project,voted on yesterday.",
  },
  {
    title: "The party's over, oilsands. Time to call it a day, Trudeau.",
    date: "2017-07-17",
    url: "https://ipolitics.ca/2017/07/17/the-partys-over-oilsands-time-to-call-it-a-day-trudeau/",
    summary: "The oilsands have become, politically, the gift that keeps on taking. Prime Minister Justin Trudeau’s brand has been badly tarnished by his pro-pipeline stance even as evidence mounts that new pipeline capacity isn’t needed. Alberta Premier Rachel Notley continues to pretend pipelines will bring back the glory days for the province’s energy sector — even …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/07/12257651.jpg",
    pull_quote: "The oilsands have become, politically, the gift that keeps on taking. Prime Minister Justin Trudeau’s brand has been badly tarnished by his pro-pipeline stance even as evidence mounts that new pipeline capacity isn’t needed. Alberta Premier Rachel Notley continues to pretend pipelines will bring back the glory days for the province’s energy sector — even as crude prices languish in the mid $40s due to cheaper U.S. shale oil, and even as OPEC and Russia hold back their own production to shore up ",
  },
  {
    title: "Fossil fuels and the political power of magical thinking",
    date: "2017-08-12",
    url: "https://ipolitics.ca/2017/08/12/fossil-fuels-and-the-political-power-of-magical-thinking/",
    summary: "Bill Clinton’s presidential campaign team once coined a phrase — “The economy, stupid” — to remind its people constantly of what the election was really about. Good advice. Canadian politicians would do well to take it, since many of them seem to have lost track of market forces in their pursuit of fantastic fossil fuel …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/08/09144126.jpg",
    pull_quote: "Bill Clinton’s presidential campaign team once coined a phrase — “The economy, stupid” — to remind its people constantly of what the election was really about.",
  },
  {
    title: "Ottawa's climate change strategy is largely imaginary",
    date: "2017-09-15",
    url: "https://ipolitics.ca/2017/09/15/ottawas-climate-change-strategy-is-largely-imaginary/",
    summary: "Catherine McKenna is a very busy environment minister. She meets with representatives of the EU and China this week and her department is setting up a website to teach children about climate change. She came out swinging against her critics over the decision to put climate change on the table in the NAFTA negotiations and …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2015/11/099232411.jpg",
    pull_quote: "Catherine McKenna is a very busy environment minister. She meets with representatives of the EU and China this week and her department is setting up a websiteto teach children about climate change. She came out swinging against her criticsover the decision to put climate change on the tablein the NAFTA negotiations and is setting upa panel of high profile politicians and CEOsto advise the NAFTA talks on environmental issues.",
  },
  {
    title: "How will we meet our Paris commitments? Nobody has a clue.",
    date: "2017-09-26",
    url: "https://ipolitics.ca/2017/09/26/how-will-we-meet-our-paris-commitments-nobody-has-a-clue/",
    summary: "The Trudeau government is great with words, not so great with deeds. The prime minister gives a fine speech and his recent address to the United Nations General Assembly was no exception. But look closer at the words and ask yourself: Is Trudeau really saying what he’s saying? He speaks the words well. But do …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/09/IMG_2242.jpg",
    pull_quote: "The Trudeau government is great with words, not so great with deeds. The prime minister gives a fine speech and his recent address to the United Nations General Assembly was no exception.",
  },
  {
    title: "What the National Energy Board won't tell you about pipelines",
    date: "2017-11-02",
    url: "https://ipolitics.ca/2017/11/02/what-the-national-energy-board-wont-tell-you-about-pipelines/",
    summary: "The 2017 UN climate change conference in Bonn — otherwise known as COP23 — starts Monday. A year ago I said Environment Minister Catherine McKenna would be going there with nothing to brag about. This year, she can at least make small talk about her plans to teach children about climate change. Meanwhile, Minister of …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/11/shutterstock_336253784.jpg",
    pull_quote: "The 2017 UN climate change conference in Bonn — otherwise known as COP23 — starts Monday. A year ago I said Environment Minister Catherine McKenna would be going there with nothing to brag about. This year, she can at least make small talk about her plansto teach children about climate change.",
  },
  {
    title: "McKenna says she has a climate plan. She should prove it.",
    date: "2017-11-13",
    url: "https://ipolitics.ca/2017/11/13/mckenna-says-climate-plan-prove/",
    summary: "“The first thing you have to do is have a plan; you have to implement your plan, and then you have to ratchet up ambition. That’s part of the Paris agreement, and that’s what we’re absolutely committed to doing.” That’s Environment Catherine McKenna in an interview she gave to the Globe and Mail before heading …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/05/May.1806956.jpg",
    pull_quote: "“The first thing you have to do is have a plan; you have to implement your plan, and then you have to ratchet up ambition. That’s part of the Paris agreement, and that’s what we’re absolutely committed to doing.”",
  },
  {
    title: "Keystone XL is already in deep trouble",
    date: "2017-11-24",
    url: "https://ipolitics.ca/2017/11/24/keystone-xl-already-deep-trouble/",
    summary: "U.S. Secretary of Energy Rick Perry came in for a lot of well-deserved mockery over his statement about the economics of coal: “Here’s a little economics lesson: supply and demand. You put the supply out there and the demand will follow.” Which is … not how supply and demand works. It doesn’t work the way …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/11/Nov.291074.jpg",
    pull_quote: "U.S. Secretary of Energy Rick Perry came in for a lot of well-deserved mockery over his statement about the economics of coal:",
  },
  {
    title: "What's behind the oilsands' transportation bottleneck?",
    date: "2018-01-05",
    url: "https://ipolitics.ca/2018/01/05/whats-behind-oilsands-transportation-bottleneck/",
    summary: "What with all the talk of the supposed steep discounts on Canadian oil and need for new markets, you might think that we’ve needed new pipelines for at least a decade. Not so. Industry and government have been crying wolf. Alberta has had significant surplus pipeline capacity. Genscape, the pipeline and crude storage monitoring company, …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/09/shutterstock_391966078.jpg",
    pull_quote: "What with all the talk of the supposed steep discounts on Canadian oil and need for new markets, you might think that we’ve needed new pipelines for at least a decade. Not so. Industry and government have been crying wolf.",
  },
  {
    title: "McKenna's big-game talk conceals Canada's small-results future",
    date: "2018-01-15",
    url: "https://ipolitics.ca/2018/01/15/mckennas-big-game-talk-conceals-canadas-small-results-future/",
    summary: "The Minister of Environment & Climate really gets it: you don’t have to actually reduce carbon emissions, you just have to confidently walk around talking like you want to reduce them.  After a report to the UN from McKenna’s own department stating Canada won’t be anywhere close to 2030 targets, she said “We are 100 per …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/09/Sept.280243.jpg",
    pull_quote: "The Minister of Environment & Climate really gets it: you don’t have to actually reduce carbon emissions, you just have to confidently walk around talking like you want to reduce them.  After a report to the UN from McKenna’s own department stating Canada won’t be anywhere close to 2030 targets, she said“We are 100 per cent committed to meeting Canada’s 2030 climate change target, and I’m proud of the progress we’re making.”",
  },
  {
    title: "Why nobody should bet on Keystone XL being built",
    date: "2018-01-26",
    url: "https://ipolitics.ca/2018/01/26/nobody-bet-keystone-xl-built/",
    summary: "It’s the Yogi Berrism that never gets old: “It’s déjà vu all over again.” On November 9, Reuters published a piece under this headline: ‘Keystone XL pipe has adequate commercial support: TransCanada‘. TransCanada put out a press release over a month later: ‘TransCanada Confirms Commercial Support for Keystone XL’. How many times do they have …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2014/04/06206288-1024x682.jpg",
    pull_quote: "It’s the Yogi Berrism that never gets old: “It’s déjà vu all over again.”",
  },
  {
    title: "Why exactly is Trans Mountain in the national interest prime minister?",
    date: "2018-02-11",
    url: "https://ipolitics.ca/2018/02/11/exactly-trans-mountain-national-interest-prime-minister/",
    summary: "“What the current government in British Columbia is doing is intentionally trying to frustrate the pipeline. It is not legal, it is unconstitutional and it is really bad for Canada. In this country, we set rules, we set goal posts and you can’t change them halfway through.” That’s former premier of British Columbia premier Christy …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2018/02/kinder-morgan-trans-mountain-expansion-project-s-westeridge-loading-dock-in-burnaby-b-c.jpg",
    pull_quote: "“What the current government in British Columbia is doing is intentionally trying to frustrate the pipeline. It is not legal, it is unconstitutional and it is really bad for Canada. In this country, we set rules, we set goal posts and you can’t change them halfway through.” That’sformer premier of British Columbia premier Christy Clarkat the Manning Networking conference in Ottawa on Saturday",
  },
  {
    title: "The truth about Trudeau's Trans Mountain tradeoff",
    date: "2018-02-22",
    url: "https://ipolitics.ca/2018/02/22/truth-trudeaus-trans-mountain-tradeoff/",
    summary: "The prime minister must be surprised at the reaction to a quote from his National Observer interview last week, that approval of Kinder Morgan’s Trans Mountain pipeline “was always a tradeoff” for climate action in Alberta. I say ‘surprised’ because that statement is entirely consistent with what he and his ministers have been saying over and …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2016/11/Nov.290822.jpg",
    pull_quote: "The prime minister must be surprised at the reaction to a quote from his National Observer interview last week, that approval of Kinder Morgan’s Trans Mountain pipeline “was always a tradeoff” forclimate action in Alberta. I say ‘surprised’ because that statement is entirely consistent with what he and his ministers have been saying over and over again since being elected to lead — hell, even before they were elected. It should be no surprise. But headlines like “Trudeau’s Orwellian logic:We red",
  },
  {
    title: "McKenna's bafflegab fails to counter that GHG targets keep being missed",
    date: "2018-03-06",
    url: "https://ipolitics.ca/2018/03/06/mckennas-bafflegab-fails-counter-ghg-targets-keep-missed/",
    summary: "Catherine McKenna needs access to a good thesaurus (they have them online now you know Environment and Climate Change ministry staff). Every time she talks about our climate change target she says we’re going to “absolutely” meet the target. She just said it again this week at the cities and climate change conference in Edmonton. …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2015/12/Dec.150120.jpg",
    pull_quote: "\"McKenna’s department is so bereft of ideas that even after bottom lining in some unspecified improvements they still remain short of Canada's ambitious Paris goal.\"",
  },
  {
    title: "Trans Mountain rhetoric has become dumb on all sides",
    date: "2018-04-11",
    url: "https://ipolitics.ca/2018/04/11/trans-mountain-rhetoric-has-become-dumb-on-all-sides/",
    summary: "Permit me this thought experiment. Let’s say Ontario decided they needed to dump their nuclear waste in Alberta because of the great geology they have in Alberta for storing stuff like that.  Say the Ontario government and the federal government both signed on saying it was a great idea and said don’t worry we …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2018/04/LAR2040-1024x778.jpg",
    pull_quote: "\"It’s just not true that we need that pipeline so Alberta does a better job on climate change.\"",
  },
  {
    title: "Trudeau's lack of patience is showing",
    date: "2018-04-15",
    url: "https://ipolitics.ca/2018/04/15/trudeaus-lack-of-patience-is-showing/",
    summary: "There’s a telling scene in the documentary God Save Justin Trudeau just before he’s about to give a surprise shellacking to Patrick Brazeau in that infamous charity boxing match. He says to Sophie Grégoire Trudeau: “I was put on this earth to do this. They underestimate me, and then I win.” And then she says, …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/12/18181464.jpg",
    pull_quote: "There’s a telling scene in the documentaryGod Save Justin Trudeaujust before he’s about to give a surprise shellacking to Patrick Brazeau in that infamous charity boxing match. He says to Sophie Grégoire Trudeau: “I was put on this earth to do this. They underestimate me, and then I win.”",
  },
  {
    title: "Emergency debate ignores simple truth: no one needs Alberta's oil",
    date: "2018-04-17",
    url: "https://ipolitics.ca/2018/04/17/emergency-debate-fails-to-tackle-simple-truth-no-one-wants-albertas-oil/",
    summary: "In Parliament’s emergency debate on Trans Mountain Expansion the first speaker, Conservative MP Shannon Stubbs, talked a lot about economics but forgot to mention world price of crude, the most fundamental element of the story. She talked about energy investment falling off under Justin Trudeau at a record rate and blamed the prime minister for …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2013/12/05115670-1024x670.jpg",
    pull_quote: "\"It was truly disgusting in this emergency debate that the Conservatives continue to push the party line that the pipeline is necessary and that good times are coming back to Alberta if it is built.\"",
  },
  {
    title: "Canada's pipelines struggle to find new routes to old markets",
    date: "2018-05-01",
    url: "https://ipolitics.ca/2018/05/01/882297/",
    summary: "It seems all of our Canadian oil pipeline projects are having major problems, even one that seems at first blush to be, to use a Harperism, a “no-brainer.” Enbridge’s Line 3 replacement project is a massive pipeline that starts in Alberta, enters into the U.S. through North Dakota and travels across Minnesota for about 300 …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2015/11/3269460.jpg",
    pull_quote: "\"The new route Enbridge wanted completely avoided any First Nations territory. And, this is where it gets sticky for Enbridge...\"",
  },
  {
    title: "Trudeau's infatuation with Trans Mountain baffles the mind",
    date: "2018-05-31",
    url: "https://ipolitics.ca/2018/05/31/trudeaus-infatuation-with-trans-mountain-baffles-the-mind/",
    summary: "Remember back at the beginning, when the “sunny” new government told us Canada was back and immediately started showing us the socially progressive actions that proved that. Remember the effort to get Syrian refugees in and how proud we all felt as our photogenic dynamic young cool prime minister met with one of the first …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2018/05/MAY4246-1024x772.jpg",
    pull_quote: "\"So why the gift to Kinder Morgan? What is it about this pipeline that is driving the Trudeau Liberals to desperate measures to get it built at high political cost, high environmental risk and now high economic cost?\"",
  },
  {
    title: "Let's fess up to our failings on climate change and then do something",
    date: "2018-06-15",
    url: "https://ipolitics.ca/2018/06/15/lets-fess-up-to-our-failings-on-climate-change-and-then-do-something/",
    summary: "Think back a few short weeks, before the collapse of the NAFTA talks, before the Mike Pence demand to Justin Trudeau for a NAFTA sunset clause, before Justin became “our guy” for finally saying something to Trump. Think back before all that, back when Trudeau had just bought an old pipeline and a new mess …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/08/shutterstock_128481350-2.jpg",
    pull_quote: "\"You’d have to say parts of the G7 have really been taking this seriously and have put actions behind their 'commitments.' Even Japan and the U.S. have made progress. Canada, not so much.\"",
  },
  {
    title: "Canada's leaders still just trying to fake it 'til they make it on climate",
    date: "2018-06-23",
    url: "https://ipolitics.ca/2018/06/23/canadas-leaders-still-just-trying-to-fake-it-til-they-make-it-on-climate/",
    summary: "Last week there was a ministerial meeting in Belgium where environment ministers from Europe and China met to continue to push for the COP21 Paris commitments.  Oh and Canada was there too, though it isn’t at all clear why given what we said. Ah Catherine McKenna, our Environment and Climate Change Minister. Here’s what she …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2015/01/759081.jpg",
    pull_quote: "Catherine McKenna has said multiple times we are going to “absolutely” meet that Harper target.  Simple math says it’s impossible without major restructuring of our economy,  especially our energy sector and particularly the West where 60 per cent of our emissions originate.",
  },
  {
    title: "Canadians need to stop and question the economics of competing pipeline plans",
    date: "2018-07-20",
    url: "https://ipolitics.ca/2018/07/20/canadians-need-to-question-the-economics-of-competing-pipeline-plans/",
    summary: "I went to see the film “Won’t You Be My Neighbor” at a theatre in Vancouver, British Columbia a short while ago.  It was a film about Fred Rogers — a.k.a. Mr. Rogers — and the ideas he wanted to communicate through his long running children’s television show. It was a very good film, many …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2015/08/09246888.jpg",
    pull_quote: "Trudeau’s tenure may only be four years but in the end Jim Carr’s pipeline may be the deciding factor as progressive voters in this country decide whether they can support a party who claims to be climate warriors but who go as far as to buy a pipeline to ensure it is rammed through for some pretty undefined benefits.",
  },
  {
    title: "New carbon rules just a smokescreen allowing industries to pollute more",
    date: "2018-08-02",
    url: "https://ipolitics.ca/2018/08/02/new-carbon-rules-just-a-smokescreen-that-permits-industries-to-pollute-more/",
    summary: "Well, well.  The same day the New York Times published “Losing Earth: The Decade We Almost Stopped Climate Change” our media reported that our non-eco-warriors in Ottawa announced they were backing off carbon pricing for some of our heaviest emitting industry in Canada for “competitiveness” reasons.  Catherine McKenna illustrates exactly what the Times describes in their …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2018/04/08583532-1024x692.jpg",
    pull_quote: "But no matter the exact explanation, you can see we have an incredibility complicated tax on industry that is based on something called average energy intensity. One thing industry likes for making investments is to understand the regulatory environment and to be able to calculate what the impacts of taxes are on their operations.",
  },
  {
    title: "Trudeau risks losing his flock over climate file",
    date: "2018-09-01",
    url: "https://ipolitics.ca/2018/09/01/trudeau-risks-losing-his-flock-over-climate-file/",
    summary: "A friend who lectures on leadership to senior managers in Canadian industry tells them they can’t inspire a level of commitment in their people that the leaders don’t have themselves.  So if you want people to come along with you for long term, you have to actually believe and deliver on what you are saying. …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2018/05/19145723.jpg",
    pull_quote: "Instead of embarrassment or promising to get back to the principles they ran on, we are now getting more of the certainty this pipeline will be built by Trudeau and company.  Finance minister Bill Morneau said after the court decision that he is still choosing to purchase the project because it is a “sound investment”.  Hard to imagine how that is possible.",
  },
  {
    title: "Trudeau's pet projects don't mesh with Canada's climate goals",
    date: "2018-10-12",
    url: "https://ipolitics.ca/article/trudeaus-pet-projects-dont-mesh-with-canadas-climate-goals/",
    summary: "In Incheon, South Korea last week the world’s top climate scientists were meeting to come to an agreement on the final draft of exactly how screwed the world is unless everyone starts getting really serious about climate change. We have ten years to make massive changes to even have a chance. Meanwhile in Canada, the …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/04/13123853.jpg",
    pull_quote: "In Incheon, South Korea last week the world’s top climate scientists were meeting to come to an agreement on the final draft of exactly how screwed the world is unless everyone starts getting really serious about climate change. We have ten years to make massive changes to even have a chance.",
  },
  {
    title: "Cracking the puzzle of Canada's pipeline problem",
    date: "2018-11-16",
    url: "https://ipolitics.ca/2018/11/16/cracking-the-puzzle-of-canadas-pipeline-problem/",
    summary: "Despite the rhetoric we’ve heard for years now, Canada actually enjoyed the benefits of the world price for our crude oil for a few years. Those historically brutal spreads in price disappeared in late 2014 as pipeline capacity in the U.S. grew and the Canadian system also quietly expanded. Before the flow of oil in …",
    thumbnail_url: "https://ipolitics.ca/wp-content/uploads/2017/12/17976057-1024x690.jpg",
    pull_quote: "Despite the rhetoric we’ve heard for years now, Canada actually enjoyed the benefits of the world price for our crude oil for a few years. Those historically brutal spreads in price disappeared in late 2014 as pipeline capacity in the U.S. grew and the Canadian system also quietly expanded.",
  }
];

// ─── Upsert iPolitics collection ──────────────────────────────────────────────

const [existingCollection] = await sql`
  SELECT id FROM op_ed_collections WHERE slug = 'ipolitics'
`;

let collectionId;
if (existingCollection) {
  collectionId = existingCollection.id;
  console.log(`iPolitics collection already exists (id=${collectionId})`);
} else {
  const [newCollection] = await sql`
    INSERT INTO op_ed_collections (publication, slug, masthead_url, description, display_order)
    VALUES (
      'iPolitics',
      'ipolitics',
      '/mastheads/ipolitics.svg',
      'Opinion columns published in iPolitics, a Canadian political news outlet.',
      1
    )
    RETURNING id
  `;
  collectionId = newCollection.id;
  console.log(`Created iPolitics collection (id=${collectionId})`);
}

// ─── Seed articles ─────────────────────────────────────────────────────────────

let inserted = 0;
let skipped = 0;

for (const article of ipoliticsArticles) {
  const [existing] = await sql`SELECT id FROM op_eds WHERE url = ${article.url}`;
  if (existing) {
    skipped++;
    continue;
  }
  await sql`
    INSERT INTO op_eds (collection_id, publication, title, url, date, summary, pull_quote, thumbnail_url, display_order, published)
    VALUES (
      ${collectionId},
      'iPolitics',
      ${article.title},
      ${article.url},
      ${article.date},
      ${article.summary},
      ${article.pull_quote},
      ${article.thumbnail_url},
      0,
      true
    )
  `;
  inserted++;
}

console.log(`Done: ${inserted} inserted, ${skipped} skipped.`);

// ─── Verify ────────────────────────────────────────────────────────────────────

const [{ count }] = await sql`
  SELECT COUNT(*) AS count FROM op_eds WHERE collection_id = ${collectionId}
`;
console.log(`Total iPolitics articles in DB: ${count}`);
