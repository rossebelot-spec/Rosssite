# Handover: Video hosting (R2), large files, and roadmap

## Purpose for the next agent

This document captures **owner intent and architecture direction** for video delivery, plus **operational commands** already in the repo. It does **not** assume prior chat context.

**Read first:** `db/schema.ts` (`videos` table), `components/video/video-main.tsx`, `lib/server-actions/videos.ts`, `app/admin/videos/[id]/page.tsx`.

---

## Current product behavior (as of this handover)

- **`videos.r2_url`** (optional in schema text, but central in UX): when set, the public player uses a **native `<video>`** element with that URL (**MP4** over HTTPS). When unset, playback still falls back to **Vimeo iframe** via **`videos.vimeo_id`** (`vimeo_id` is **NOT NULL** today).
- **Thumbnail**: stored URL (`thumbnail_url`) + alt; often uploaded via existing **ImageUploader** (Vercel Blob pattern in admin).
- **Featured home video**: `is_featured_for_home` + `lib/featured-home-video.ts`; same R2 vs Vimeo branch applies in the home player.

---

## Direction (confirmed by maintainers — not necessarily implemented)

1. **Cloudflare R2 is the canonical path** for self-hosted video (MP4 URLs the site controls). **Vimeo is legacy**; the goal is to **remove `vimeo_id` from schema and codebase** once migration/cleanup allows.
2. **Optional embeds** (e.g. **YouTube**) may exist alongside R2: **not** the same as uploading a file—would need an explicit model (e.g. provider + id / embed URL) and a separate player branch (`iframe`).
3. **Encoding does not run on Vercel.** **HandBrake** (or similar) runs **locally** to produce web-friendly MP4s; maintainers preview files locally before publishing.
4. **“All actions in app”** is the UX target: admin should ultimately support **upload / attach hosted URL** without relying on CLI for routine work. **Large files** must **not** be proxied through the Next.js server if that implies body-size limits—use **presigned upload to R2** from the browser (planning only until built).
5. **CLI remains valid** as **bulk migration** or **break-glass** for very large uploads when the in-app path is not ready.

---

## Large files (e.g. ~163 MB and up)

- **R2 + S3 `PutObject` from a local script** using a **file read stream** is appropriate for **hundreds of MB**; the main constraints are disk, uplink, and time—not an artificial 163 MB ceiling on R2 itself.
- **Vercel route handlers** that accept the **entire MP4 body** are the wrong place for big binaries; **direct-to-R2** (presigned PUT from the client, or CLI from maintainers’ machines) avoids serverless payload limits.

---

## Existing repo tooling: `scripts/migrate-videos-to-r2.mjs`

**Role:** one-off / batch pipeline: upload compressed MP4s to **Cloudflare R2**, then set **`videos.r2_url`** in Neon.

**Conventions:**

- Reads **`DATABASE_URL`** from **`.env.local`** (via `dotenv`).
- **`COMPRESSED_DIR`**: folder containing `*.mp4` (default: `/Volumes/Archive/VimeoMasters/Compressed` — override if your files live elsewhere).
- **Matching rule:** database row **`videos.slug`** (case-insensitive) must equal the **filename stem** of the mp4: `my-slug.mp4` ↔ `slug = my-slug`.
- **Selection:** only rows with **`r2_url IS NULL`** are considered for upload.

**Commands:**

```bash
# Plan only (no credentials prompt for upload path until --execute)
node scripts/migrate-videos-to-r2.mjs

# Upload + DB update (prompts for R2 Access Key ID and Secret)
npx -y -p @aws-sdk/client-s3@3 node scripts/migrate-videos-to-r2.mjs --execute
```

**Config in script (today):** `R2_ACCOUNT_ID`, `R2_ENDPOINT`, `R2_BUCKET` (e.g. `videos`), **`R2_PUBLIC_BASE`** (public `r2.dev`-style base URL). These are **hardcoded** in the script—confirm they still match the Cloudflare dashboard before running against production.

**If `--execute` fails:** fix **missing slug ↔ file** mappings first (script exits when any planned row has no matching file).

---

## Related scripts / references

- **`scripts/compress-vimeo-archive.mjs`**: archive-side compression workflow (separate from this handover’s DB+R2 migrate script).
- **`scripts/process-flickr-photos.mjs`**: R2 upload pattern for **photos** bucket / different public base—useful reference for S3 client setup, not video-specific.

---

## Planned implementation themes (when asked to build)

| Theme | Notes |
|-------|--------|
| Drop Vimeo | Migration to nullable or removed `vimeo_id`; update all queries, admin validation, `VideoMain`, featured player, APIs. |
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
- Whether **YouTube** (or other embeds) ships in **v1** of the Vimeo removal or later.
- **Data cleanup:** rows that still only have Vimeo when Vimeo is removed need explicit policy (archive, re-upload to R2, or hide).

---

**End of handover.** Update this file when Vimeo is removed or when presigned admin upload ships.
