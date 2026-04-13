/**
 * Update the Policy Magazine article thumbnail to use the local cover image.
 *
 * Before running:
 *   1. Save the Policy Magazine cover image to:
 *      public/thumbnails/policy-magazine-cover.jpg
 *
 * Then run:
 *   node scripts/update-policy-thumbnail.mjs
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

const POLICY_URL =
  "https://policymagazine.ca/how-shifts-in-global-markets-should-shape-canadas-energy-strategy/";

const THUMBNAIL = "/thumbnails/policy-magazine-cover.jpg";

const result = await sql`
  UPDATE op_eds
  SET thumbnail_url = ${THUMBNAIL},
      updated_at    = NOW()
  WHERE url = ${POLICY_URL}
  RETURNING id, title, thumbnail_url
`;

if (result.length === 0) {
  // Try a partial URL match in case the URL differs slightly
  const fallback = await sql`
    UPDATE op_eds
    SET thumbnail_url = ${THUMBNAIL},
        updated_at    = NOW()
    WHERE publication = 'Policy Magazine'
    RETURNING id, title, thumbnail_url
  `;
  if (fallback.length === 0) {
    console.error("No Policy Magazine article found. Check the URL in your database.");
    process.exit(1);
  }
  console.log("Updated via publication name fallback:");
  console.log(fallback);
} else {
  console.log("Updated:");
  console.log(result);
}
