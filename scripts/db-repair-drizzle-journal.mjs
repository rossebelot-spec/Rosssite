/**
 * Backfills missing rows in `drizzle.__drizzle_migrations` when the live DB schema
 * already matches applied SQL but the journal was never updated (common after manual
 * SQL or a restored DB). Hashes must match `drizzle-kit` (SHA-256 of each .sql file).
 *
 * Safe: only INSERTs rows for migration hashes not already present.
 *
 * Usage: node scripts/db-repair-drizzle-journal.mjs
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { config } = await import("dotenv");
config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: DATABASE_URL / DATABASE_URL_UNPOOLED not set");
  process.exit(1);
}

const journalPath = path.resolve(__dirname, "../db/migrations/meta/_journal.json");
const journal = JSON.parse(readFileSync(journalPath, "utf8"));

/** Never insert the last journal entry here — `drizzle-kit migrate` must apply that SQL. */
const ENTRIES_TO_REPAIR = journal.entries.slice(0, -1);

function hashFile(tag) {
  const p = path.resolve(__dirname, "../db/migrations", `${tag}.sql`);
  const body = readFileSync(p, "utf8");
  return createHash("sha256").update(body).digest("hex");
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const { rows: existing } = await client.query(
    `SELECT hash FROM drizzle.__drizzle_migrations`,
  );
  const have = new Set(existing.map((r) => r.hash));

  let inserted = 0;
  for (const entry of ENTRIES_TO_REPAIR) {
    const hash = hashFile(entry.tag);
    if (have.has(hash)) continue;

    const [{ maxId }] = (
      await client.query(`SELECT coalesce(max(id), 0)::int AS "maxId" FROM drizzle.__drizzle_migrations`)
    ).rows;
    const nextId = maxId + 1;

    await client.query(
      `INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES ($1, $2, $3)`,
      [nextId, hash, String(entry.when)],
    );
    have.add(hash);
    inserted++;
    console.log(`Inserted journal row id=${nextId} tag=${entry.tag}`);
  }

  if (inserted === 0) {
    console.log("Journal already has all intermediate migrations; nothing to insert.");
  } else {
    console.log(`OK: inserted ${inserted} migration row(s) (latest migration left for drizzle-kit migrate).`);
  }
} finally {
  await client.end();
}
