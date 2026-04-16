/**
 * Update draft literary publications with verified data and publish them.
 * Run from the repo root:  node scripts/update-draft-publications.mjs
 *
 * Sources verified April 2026 via live journal websites.
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

console.log("Updating draft literary publications…\n");

// ── 1. World Poetry Review ────────────────────────────────────────────────────
await sql`
  UPDATE literary_publications SET
    title       = 'Paul Éluard — twenty-one poems (with Sara Burant)',
    date        = '2025-10',
    url         = 'https://worldpoetryreview.org/2025/10/17/twenty-one-poems-by-paul-eluard/',
    description = 'Twenty-one poems by Paul Éluard, co-translated with Sara Burant. Published in World Poetry Review, Issue Twelve (October 2025).',
    published   = true,
    updated_at  = NOW()
  WHERE publication = 'World Poetry Review' AND published = false
`;
console.log("✓  World Poetry Review — Issue Twelve, October 2025");

// ── 2. Canadian Literature ────────────────────────────────────────────────────
await sql`
  UPDATE literary_publications SET
    title       = '"In the Company of Good and Evil in the Land of Narrative Drift"',
    date        = '2022',
    url         = 'https://canlit.ca/article/in-the-company-of-good-and-evil-in-the-land-of-narrative-drift/',
    description = 'Published in Canadian Literature Issue 251: Poetics and Extraction (2022), pp. 119–120. Guest-edited by Melanie Dennis Unrau.',
    published   = true,
    updated_at  = NOW()
  WHERE publication = 'Canadian Literature' AND published = false
`;
console.log('✓  Canadian Literature — Issue 251, 2022');

// ── 3. Packingtown Review (was "Packington Review" — correcting name) ─────────
await sql`
  UPDATE literary_publications SET
    title       = 'Paul Éluard translations (with Sara Burant)',
    publication = 'Packingtown Review',
    date        = '2024',
    url         = 'http://packingtownreview.com/',
    description = 'Paul Éluard translations co-translated with Sara Burant. Published in Packingtown Review, Volume 21, Spring 2024.',
    published   = true,
    updated_at  = NOW()
  WHERE publication ILIKE '%packington%' AND published = false
`;
console.log("✓  Packingtown Review — Volume 21, Spring 2024");

// ── 4. Blue Unicorn ───────────────────────────────────────────────────────────
await sql`
  UPDATE literary_publications SET
    title       = '"Necessity" — Paul Éluard translation (with Sara Burant)',
    date        = '2025-11',
    url         = 'https://blueunicorn.org/product/blue-unicorn-volume-49-number-1-fall-2025/',
    description = 'Translation of Paul Éluard''s "Necessity", co-translated with Sara Burant. Published in Blue Unicorn, Volume 49, Number 1, Fall 2025, p. 10.',
    published   = true,
    updated_at  = NOW()
  WHERE publication = 'Blue Unicorn' AND published = false
`;
console.log("✓  Blue Unicorn — Volume 49, Fall 2025");

// ── 5. Transformation Review — update existing draft to curated review ─────────
await sql`
  UPDATE literary_publications SET
    title       = '"Euripides and Professor Murray" (curated)',
    date        = '2026-02-22',
    url         = 'https://www.thetransformationreview.com/reviews/euripides-and-professor-murray',
    description = 'Curated classic: T.S. Eliot''s 1920 review of Gilbert Murray''s translation of Euripides, curated by Ross Belot. Published in The Transformation Review, February 2026.',
    kind        = 'journal',
    published   = true,
    updated_at  = NOW()
  WHERE publication = 'Transformation Review' AND published = false
`;
console.log("✓  The Transformation Review — curated review, February 2026");

// ── 6. Transformation Review — insert second entry (Call for Submissions) ──────
await sql`
  INSERT INTO literary_publications
    (title, publication, date, kind, url, description, display_order, published)
  VALUES (
    '"Call for Submissions" (essay)',
    'The Transformation Review',
    '2026-03-07',
    'journal',
    'https://www.thetransformationreview.com/essays/call-for-submissions',
    'Essay outlining The Transformation Review''s mission as a journal devoted to the art and craft of poetry in translation. Published March 7, 2026.',
    24,
    true
  )
  ON CONFLICT (title, publication) DO NOTHING
`;
console.log("✓  The Transformation Review — Call for Submissions essay, March 2026");

// ── 7. Transformation Review — Liesl Ujváry review ────────────────────────────
await sql`
  INSERT INTO literary_publications
    (title, publication, date, kind, url, description, display_order, published)
  VALUES (
    'Review: Good & Safe by Liesl Ujváry',
    'The Transformation Review',
    '2026-02-22',
    'journal',
    'https://www.thetransformationreview.com/reviews/ujvary-s-collection-from-1977-resonates-today',
    'Review of Good & Safe by Liesl Ujváry (translated by Anne Cotten & Anna-Isabella Dinwoodie; World Poetry, 2025). Originally published in German in 1977. Published in The Transformation Review, February 2026.',
    25,
    true
  )
  ON CONFLICT (title, publication) DO NOTHING
`;
console.log("✓  The Transformation Review — review of Good & Safe by Liesl Ujváry, February 2026");

// ── 8. Workers/climate change anthology ──────────────────────────────────────
await sql`
  UPDATE literary_publications SET
    title       = 'Poem in I''ll Get Right On It',
    publication = 'I''ll Get Right On It: Poems on Working Life in the Climate Crisis (Fernwood Publishing)',
    date        = '2025-10',
    url         = 'https://fernwoodpublishing.ca/book/ill-get-right-on-it',
    description = 'Poetry anthology about making a living under conditions of climate disaster. Edited by the Land and Labour Poetry Collective (including Melanie Dennis Unrau). Fernwood Publishing, October 2025.',
    kind        = 'anthology',
    published   = true,
    updated_at  = NOW()
  WHERE publication ILIKE '%workers%climate%' OR publication ILIKE '%climate%change%antholog%'
`;
console.log("✓  I'll Get Right On It — Fernwood Publishing, October 2025");

// ── 9. Ezra: An Online Journal of Translation ─────────────────────────────────
await sql`
  INSERT INTO literary_publications
    (title, publication, date, kind, url, description, display_order, published)
  VALUES (
    'Paul Éluard translations (with Sara Burant)',
    'Ezra: An Online Journal of Translation',
    '2025',
    'translation',
    'https://ezratranslation.com',
    'Translations of Paul Éluard including "Beautiful and Lifelike," "Season of Loves," and "Hardly Disfigured," co-translated with Sara Burant. Published in Ezra: An Online Journal of Translation, Volume 19, #1, Winter 2025.',
    26,
    true
  )
  ON CONFLICT (title, publication) DO NOTHING
`;
console.log("✓  Ezra: An Online Journal of Translation — Volume 19 #1, Winter 2025");

console.log("\nAll drafts resolved. Done.");
