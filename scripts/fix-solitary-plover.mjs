/**
 * Fix the Solitary Plover entry: correct title, date, and publish it.
 * Run from the repo root:  node scripts/fix-solitary-plover.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const result = await sql`
  UPDATE literary_publications
  SET
    title       = '"Poem For Bayfield WI"',
    date        = '2023-01',
    description = 'Published in the Winter 2023 issue of The Solitary Plover, the journal of the Friends of Lorine Niedecker.',
    published   = true,
    updated_at  = NOW()
  WHERE publication = 'The Solitary Plover (Friends of Lorine Niedecker)'
  RETURNING id, title, publication
`;

if (result.length === 0) {
  console.log("No row found — check the publication name.");
} else {
  console.log(`✓ Updated: "${result[0].title}" — ${result[0].publication} (id=${result[0].id})`);
}
