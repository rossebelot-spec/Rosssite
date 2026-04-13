/**
 * Apply pending SQL migrations in journal order (SHA-256 of each file must match
 * `drizzle.__drizzle_migrations`). Uses `pg` with one `query()` per file — same as
 * manual applies that work on Neon; avoids `drizzle-kit migrate` exiting 1 without
 * surfacing errors on some multi-statement files.
 *
 * Usage: npm run db:migrate
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const { config } = await import("dotenv");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: DATABASE_URL / DATABASE_URL_UNPOOLED not set");
  process.exit(1);
}

const journalPath = path.resolve(__dirname, "../db/migrations/meta/_journal.json");
const journal = JSON.parse(readFileSync(journalPath, "utf8"));

function hashMigration(tag) {
  const p = path.resolve(__dirname, "../db/migrations", `${tag}.sql`);
  const body = readFileSync(p, "utf8");
  return createHash("sha256").update(body).digest("hex");
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

let applied = 0;
try {
  for (const entry of journal.entries) {
    const hash = hashMigration(entry.tag);
    const found = await client.query(
      `SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1 LIMIT 1`,
      [hash],
    );
    if (found.rows.length > 0) continue;

    const sqlPath = path.resolve(__dirname, "../db/migrations", `${entry.tag}.sql`);
    const body = readFileSync(sqlPath, "utf8");
    console.log(`Applying migration ${entry.tag}…`);

    await client.query("BEGIN");
    try {
      await client.query(body);
      const [{ maxId }] = (
        await client.query(
          `SELECT coalesce(max(id), 0)::int AS "maxId" FROM drizzle.__drizzle_migrations`,
        )
      ).rows;
      await client.query(
        `INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES ($1, $2, $3)`,
        [maxId + 1, hash, String(entry.when)],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
    applied++;
  }

  if (applied === 0) {
    console.log("Migrations up to date.");
  } else {
    console.log(`OK: applied ${applied} migration(s).`);
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await client.end();
}
