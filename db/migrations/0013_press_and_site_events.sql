CREATE TABLE "press_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"outlet" text NOT NULL,
	"date" text NOT NULL,
	"url" text,
	"description" text NOT NULL DEFAULT '',
	"published" boolean NOT NULL DEFAULT true,
	"display_order" integer NOT NULL DEFAULT 0,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "site_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"location" text NOT NULL,
	"description" text NOT NULL DEFAULT '',
	"link" text,
	"published" boolean NOT NULL DEFAULT true,
	"display_order" integer NOT NULL DEFAULT 0,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);

INSERT INTO "press_items" ("title", "outlet", "date", "url", "description", "published", "display_order") VALUES
('Montreal International Poetry Prize finalist', 'Montreal International Poetry Prize', '2022-09-21', 'https://www.montrealpoetryprize.com/2022-competition-1', 'On the short list for the $20K prize run out of McGill University.', true, 0),
('Hamilton Literary Awards 2021', 'Wolsak and Wynn Publishers', '2021-11-01', 'https://www.wolsakandwynn.ca/news-blog/ross-belot-gary-barwin-dorothy-ellen-palmer-and-sally-cooper-all-shortlisted-for-hamilton-literary-awards', 'Moving to Climate Change Hours named as a finalist for both Poetry and the Kerry Schooley Award for a book featuring the local area.', true, 1),
('Santo Tomas School of Journalism', 'The Pilar', '2021-03-12', 'https://thepilaronline.wordpress.com/2021/03/12/the-pilar-lifestyle-5/', 'Listed among five books from the University of Santo Tomas journalism school, in a "hauntingly lyrical" presentation of climate change effects. "The author has carefully crafted his poems to make the reader understand the various implications of environmental change and the intrinsic beauty of nature that is both knowing and unknowing."', true, 2),
('McMaster Alumni profile', 'Medium · McMaster Alumni', '2021-01-15', 'https://medium.com/mcmaster-alumni/ross-belot-81-74fe37545f9c', 'What do the Canadian oil industry, the CBC Poetry Prize, and the Hamilton Film Festival have in common? A review of the path from Engineering and Management at Mac to environmental writing after decades in the oil industry.', true, 3),
('The Environmental Urbanist', 'CFMU 93.3', '2021-01-05', 'https://cfmu.ca/episodes/24589-the-environmental-urbanist-episode-for-2021-01-05', 'Conversation with Jason Allen on eco-poetics and environmental writing after years in the fossil fuel industry, and how we might change course when leaders will not.', true, 4),
('Best Canadian poetry of 2020', 'CBC Books', '2020-12-15', 'https://www.cbc.ca/books/the-best-canadian-poetry-of-2020-1.5831407', 'Moving to Climate Change Hours on CBC''s year-end list (alphabetically snug with Atwood and Babstock).', true, 5),
('Former oil executive, activist, poet', 'National Observer', '2020-12-08', 'https://www.nationalobserver.com/2020/12/08/features/ross-belot-former-oil-executive-environmental-activist-poet', 'Interview on climate change, activism, and poetry after working for decades in the fossil fuel industry.', true, 6),
('All About Books interview', 'YouTube · Crystal Fletcher', '2020-10-01', 'https://www.youtube.com/watch?v=KirFNIX6vck', 'Crystal Fletcher interviews Ross for "All About Books" on Moving to Climate Change Hours.', true, 7),
('37 Canadian poetry collections to watch for in fall 2020', 'CBC Books', '2020-09-23', 'https://www.cbc.ca/books/37-canadian-poetry-collections-to-watch-for-in-fall-2020-1.5716100', '"Moving to Climate Change Hours looks at the challenges humanity has created for ourselves through climate change."', true, 8),
('Catherine Owen reviews Moving to Climate Change Hours', 'Marrow Reviews', '2020-09-22', 'https://crowgirl11.wordpress.com/2020/09/18/moving-to-climate-change-hours-by-ross-belot-wolsak-wynn-james-street-north-books-2020/', '"In these pieces, I hear the seeming simplicity of Gary Snyder''s entrees into how the crow, the ocean, the mountains can render us texts, in essence, of both knowing and unknowing."', true, 9),
('11 new books that will change how you think about the climate crisis', 'Shondaland', '2020-08-07', 'https://www.shondaland.com/inspire/books/a33501482/11-new-books-that-will-change-how-you-think-about-the-climate-crisis/', '"This is a great speculative and lyrical collection that asks hard questions with no easy answers."', true, 10),
('CBC Poetry Prize: past finalist Ross Belot has some advice', 'CBC Books', '2020-05-14', 'https://www.cbc.ca/books/literaryprizes/thinking-about-entering-the-cbc-poetry-prize-past-finalist-ross-belot-has-some-advice-your-you-1.5568618', 'Profile around the CBC Poetry Prize experience and the new book, with interviews from Ottawa and Saskatchewan.', true, 11),
('Most anticipated spring 2020 poetry', '49th Shelf', '2020-02-06', 'https://49thshelf.com/Blog/2020/02/06/Most-Anticipated-Spring-2020-Poetry-Preview', 'Moving to Climate Change Hours on 49th Shelf''s most anticipated spring poetry list.', true, 12),
('"Nothing Bothers to Remain" — CBC Poetry Prize long list', 'CBC Literary Prizes', '2018-10-31', 'https://www.cbc.ca/books/literaryprizes/nothing-bothers-to-remain-by-ross-belot-1.4876253', 'The suite of poems makes the 2018 CBC Poetry Prize long list.', true, 13),
('Finalist for the 2016 CBC Poetry Prize', 'CBC Literary Prizes', '2016-11-10', NULL, 'Named a finalist for the 2016 CBC Poetry Prize alongside partners including the Canada Council for the Arts, Air Canada enRoute, and Banff Centre for Arts and Creativity.', true, 14);

INSERT INTO "site_events" ("title", "date", "location", "description", "link", "published", "display_order") VALUES
('Hamilton Public Library — environmental poetry', '2021-11-22', 'Hamilton Public Library · Hamilton, ON', 'Jaclyn DesForges moderates a discussion with Ross, Kim Goldberg, and Claire Caldwell. 7 p.m.', 'https://www.youtube.com/watch?v=LcVzephMSYY', true, 0),
('Art Waves with Bernadette Rule', '2020-10-04', 'The Hawk Radio', 'Sunday 7 p.m. Eastern — a conversation about poetry and Moving to Climate Change Hours.', NULL, true, 1),
('Wolsak and Wynn fall 2020 poetry launch', '2020-09-30', 'Online', 'Wednesday 7 p.m. Eastern — Wolsak and Wynn online fall launch of four books, including Moving to Climate Change Hours.', 'https://www.eventbrite.ca/e/wolsak-and-wynn-fall-2020-poetry-launch-tickets-121251268809', true, 2),
('Get Lit at Lunch with Jamie Tennant', '2020-08-27', 'Podcast · Get Lit at Lunch', 'Thursday 12:30 p.m. — Jamie Tennant discusses Moving to Climate Change Hours with Ross.', 'https://www.jamietennant.ca/index.php/2020/08/27/e197-with-ross-belot/', true, 3),
('CBC interviews Ross Belot', '2020-05-09', 'CBC Radio (national)', 'Weekend morning shows across the country — St. John''s, Montreal, Ottawa, Fresh Air, Manitoba, Saskatchewan, Alberta, and BC (May 9–10, 2020).', NULL, true, 4),
('National Arts Centre — #CanadaPerforms', '2020-04-13', 'National Arts Centre · Livestream', 'Monday 7:30 p.m. ET — livestream on Facebook.', 'https://www.facebook.com/ross.belot/videos/10216708829980174/', true, 5);
