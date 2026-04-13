CREATE TABLE "about_page" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body_html" text NOT NULL DEFAULT '',
	"photo_url" text,
	"updated_at" timestamp NOT NULL DEFAULT now()
);

INSERT INTO "about_page" ("title", "body_html") VALUES (
	'Ross Belot',
	$body$<p>Ross Belot is a poet, journalist, and environmental writer based in Canada. His work spans poetry, long-form journalism, photography, and video.</p><p>He is a 2016 CBC Poetry Prize finalist and the author of <em>Moving to Climate Change Hours</em>.</p><p>His writing on energy and the environment has appeared in <em>Maclean&rsquo;s</em>, <em>Canada&rsquo;s National Observer</em>, and elsewhere.</p>$body$
);
