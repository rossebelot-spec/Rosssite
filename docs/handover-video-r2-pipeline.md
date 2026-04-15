# Handover: Video hosting (R2), large files, and roadmap

## Purpose for the next agent

This document captures **owner intent and architecture direction** for video delivery, plus **operational commands** already in the repo. It does **not** assume prior chat context.

**Read first:** `db/schema.ts` (`videos` table), `components/video/video-main.tsx`, `lib/server-actions/videos.ts`, `app/admin/videos/[id]/page.tsx`.

---

## Current product behavior

- **`videos.r2_url`**: public **HTTPS URL** to the MP4 (e.g. Cloudflare R2). Required for saving a video in admin; publishing also requires a non-empty URL. Playback uses a **native `<video>`** element only.
- **Thumbnail**: stored URL (`thumbnail_url`) + alt; often uploaded via existing **ImageUploader** (Vercel Blob pattern in admin).
- **Featured home video**: `is_featured_for_home` + `lib/featured-home-video.ts`; home hero uses the same native `<video>` when `r2_url` is set.

---

## Direction

1. **Cloudflare R2** is the canonical path for self-hosted video (MP4 URLs the site controls).
2. **Optional embeds** (e.g. **YouTube**) may be added later: separate model (provider + id) and an iframe branch — not implemented today.
3. **Encoding does not run on Vercel.** **HandBrake** (or similar) runs **locally** to produce web-friendly MP4s; maintainers preview files locally before publishing.
4. **“All actions in app”** is the UX target: admin supports **paste hosted URL** today; **presigned upload to R2** from the browser is a possible follow-up. **Large files** must **not** be proxied through the Next.js server if that implies body-size limits.
5. **CLI remains valid** as **bulk migration** or **break-glass** for very large uploads.

---

## Large files (e.g. ~163 MB and up)

- **R2 + S3 `PutObject` from a local script** using a **file read stream** is appropriate for **hundreds of MB**; the main constraints are disk, uplink, and time—not an artificial ceiling on R2 itself.
- **Vercel route handlers** that accept the **entire MP4 body** are the wrong place for big binaries; **direct-to-R2** (presigned PUT from the client, or CLI from maintainers’ machines) avoids serverless payload limits.

---

## Existing repo tooling: `scripts/migrate-videos-to-r2.mjs`

**Role:** one-off / batch pipeline: upload compressed MP4s to **Cloudflare R2**, then set **`videos.r2_url`** in Neon.

**Conventions:**

- Reads **`DATABASE_URL`** from **`.env.local`** (via `dotenv`).
- **`COMPRESSED_DIR`**: folder containing `*.mp4` (default: `/Volumes/Archive/VideoMasters/Compressed` — override if your files live elsewhere).
- **Matching rule:** database row **`videos.slug`** (case-insensitive) must equal the **filename stem** of the mp4: `my-slug.mp4` ↔ `slug = my-slug`.
- **Selection:** only rows with **`r2_url IS NULL`** are considered for upload.
- **Non-interactive CI:** set **`R2_ACCESS_KEY_ID`** and **`R2_SECRET_ACCESS_KEY`** in the environment to skip prompts for `--execute`.

**Commands:**

```bash
# Plan only (no upload until --execute)
node scripts/migrate-videos-to-r2.mjs

# Upload + DB update (prompts for R2 keys unless env vars are set)
npx -y -p @aws-sdk/client-s3@3 node scripts/migrate-videos-to-r2.mjs --execute
```

**Config in script (today):** `R2_ACCOUNT_ID`, `R2_ENDPOINT`, `R2_BUCKET` (e.g. `videos`), **`R2_PUBLIC_BASE`** (public `r2.dev`-style base URL). These are **hardcoded** in the script—confirm they still match the Cloudflare dashboard before running against production.

**If `--execute` fails:** fix **missing slug ↔ file** mappings first (script exits when any planned row has no matching file).

---

## GitHub Actions: `.github/workflows/video-r2-migrate.yml`

- **`workflow_dispatch`** — runs **plan only** against an empty `COMPRESSED_DIR` to verify DB connectivity and script health.
- Requires **`DATABASE_URL`** secret on the repo.
- **Does not** upload files; run `migrate-videos-to-r2.mjs --execute` locally (or on a self-hosted runner with your `Compressed` folder and secrets).

---

## Related scripts / references

- **`scripts/compress-video-archive.mjs`**: local HandBrake batch encode from a master archive (see `npm run compress:video-archive`).
- **`scripts/process-flickr-photos.mjs`**: R2 upload pattern for **photos** bucket / different public base—useful reference for S3 client setup, not video-specific.

---

## Planned implementation themes (optional follow-ups)

| Theme | Notes |
|-------|--------|
| Rename / clarify `r2_url` | Optionally rename to a neutral column name (e.g. `hosted_video_url`) in a migration for clarity. |
| Admin upload | Presigned URLs + progress; **never** stream whole MP4 through Vercel; admin-only routes. |
| Env | `R2_*` in `.env.local` / Vercel; keys not committed. |
| Optional YouTube | Separate fields + iframe player; xor constraint with hosted MP4 if only one allowed per row. |

---

## Database / Neon constraints (repo rules)

- Uses **`@neondatabase/serverless`** / HTTP driver: **`db.transaction()` is not used** (will throw). Use `Promise.all` or sequential awaits for multi-step updates.
- After **schema migrations**, ensure **`npm run db:migrate`** (or equivalent) is applied to the DB the app uses—see `.cursor/rules/database-migrations.mdc` and `drizzle.config.ts`.

---

## How to verify player + R2 URL

1. **Direct URL:** open the MP4 URL in a new tab; should start download or play (correct CORS / public access on the bucket).
2. **Site:** load `/video/[slug]` (and any collection that includes the video); poster + controls behave as in `video-main.tsx`.
3. **`npm run build`** before declaring routing/admin changes complete (project convention).

---

## Open questions for maintainers (do not guess in code)

- Final **public URL shape** (bare `r2.dev` vs **custom domain** on R2) for new uploads.
- Whether **YouTube** (or other embeds) ships in a future iteration.

---

**End of handover.** Update this file when presigned admin upload ships.
