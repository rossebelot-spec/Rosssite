# Root cause: `db:migrate` failures (investigation)

Date: 2026-04-13

## Summary

Today’s “migrate keeps failing” behaviour came from **two independent issues**:

1. **Real database state:** `drizzle.__drizzle_migrations` did **not** list every migration that had already been applied to Neon. The migrator then tried to **replay** an old `.sql` file (e.g. `0002_*`) against a database where those tables already existed → **SQL error** (typically `relation … already exists`).

2. **Tooling:** `drizzle-kit migrate` (v0.31.10) can exit with code **1** and print **no error text** even when PostgreSQL rejected a statement. That matches an **upstream bug**: the CLI migration progress view does not render the rejection error. The failure is real; only the **message** is hidden.

Until both are understood, it looks like “random migrate failures” instead of “journal out of sync” or “SQL rejected” plus “silent CLI.”

---

## 1. Journal out of sync (schema ahead of migration history)

**Mechanism**

- Drizzle records one row per applied migration in `drizzle.__drizzle_migrations` (hash of file contents + metadata).
- If the **live schema** was built by restores, manual SQL, another branch, or partial runs, the table can have **fewer rows** than the SQL files in `db/migrations/`.
- The migrator applies **the next file in journal order** that is **not** recorded. If that file is `0002_…` but `collection_items` already exists, Postgres errors.

**How to confirm**

```sql
SELECT id, left(hash, 16) AS hash_prefix, created_at
FROM drizzle.__drizzle_migrations
ORDER BY id;
```

Compare **count + ordering** to `db/migrations/meta/_journal.json`. If the DB is missing intermediate tags, you have drift.

**Mitigation (process)**

- After confirming the schema already matches what those missing migrations would create, backfill journal rows **for every migration except the last** (so the runner can still apply the latest file), then run `npm run db:migrate` again. This repo provides `npm run db:repair-journal` for that pattern.

---

## 2. `drizzle-kit migrate` hiding SQL errors

**Evidence**

- Observed: `[⡿] applying migrations…` then **exit code 1**, no `stderr` line with `ERROR:` or Postgres detail.
- Same migration SQL executed via `pg` `client.query(fullFile)` **succeeded**.
- **Upstream:** [drizzle-team/drizzle-orm#5601](https://github.com/drizzle-team/drizzle-orm/issues/5601) — *“migration SQL failures exit with code 1 but print no error (MigrateProgress hides rejection).”*
- Same report thread notes **drizzle-kit v0.31.10** specifically; some users report **v0.31.9** prints errors again (verify before pinning).

**Implication**

- Any SQL failure (duplicate relation, constraint, typo) looks like a **mystery exit 1**. Check **Neon → Monitoring / query logs** or Postgres logs, or run the `.sql` file manually to see the true error.

**This repo’s approach**

- `npm run db:migrate` runs `scripts/db-migrate.mjs`, which applies pending files with `pg` and logs errors with `console.error` on failure — so failures are **visible** without relying on the kit’s progress UI.

---

## 3. What “fix first” means here

| Problem                         | Fix type                                      |
|---------------------------------|-----------------------------------------------|
| Drifted journal                 | Process / one-time repair, not “retry migrate blindly” |
| Silent `drizzle-kit` output     | Upstream CLI bug; avoid that path for *apply* or upgrade/pin `drizzle-kit` when a release fixes #5601 |
| Actual SQL in a migration file  | Fix the SQL or the DB state; errors become obvious once visible |

---

## References

- [Issue #5601 — silent migrate failures](https://github.com/drizzle-team/drizzle-orm/issues/5601)
- PRs linked from that issue (e.g. clearer migration failure handling) — check drizzle release notes before changing versions.
