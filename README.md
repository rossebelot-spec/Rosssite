# Ross Belot — personal site

Next.js **16** (App Router), **React 19**, **TypeScript**. Editorial content is split between **Neon Postgres** (Drizzle ORM) and static lists under `data/*.ts`. Authoritative conventions live in **`.cursorrules`** (stack, access control, migrations, styling).

## Stack (short)

- **DB:** Drizzle + `@neondatabase/serverless` (HTTP driver — **do not** use `db.transaction()` in app code; see `.cursorrules`)
- **Auth:** NextAuth v5 (Google; `ALLOWED_ADMIN_EMAILS`); **`proxy.ts`** gates `/admin/*` (this project does **not** use `middleware.ts` for that)
- **Assets:** **Vercel Blob** for typical admin uploads (thumbnails, photography blobs). **Video** and **gallery** images use **public HTTPS URLs** — often **Cloudflare R2** — stored in `videos.r2_url` and `gallery_photos.r2_url`
- **Playback:** Native `<video>` for MP4 URLs only (no Vimeo; optional embeds like YouTube are out of scope until modeled)
- **UI:** Tailwind v4 (`app/globals.css` `@theme` tokens), shadcn-style components, TipTap in admin
- **HTML:** Root `<html>` sets **`data-scroll-behavior="smooth"`** so Next.js does not warn about `scroll-behavior: smooth` on the document element

## Documentation

| Doc | Purpose |
|-----|---------|
| **`AGENTS.md`** | Next.js 16 vs older training data — check `node_modules/next/dist/docs/` before API work |
| **`docs/README.md`** | Index of handover and topic docs in this folder |
| **`docs/handover-video-r2-pipeline.md`** | Video hosting (R2), admin paste-URL flow, migration script, GitHub workflow |
| **`docs/handover-hero-nav-layout.md`** | Home hero, `--site-header-height`, Nav measurement |
| **`docs/handover-home-featured-video-hero.md`** | Featured video in hero + third-column copy |
| **`docs/db-migrate-root-cause.md`** | Why `db:migrate` can fail (journal drift, silent drizzle-kit) |
| **`docs/tiptap-editor.md`** | Admin TipTap toolbar reference |
| **`videoplan.md`** | Video + collections architecture (cross-check with `db/schema.ts`) |

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint         # ESLint (Next core-web-vitals)
npm run build        # required before considering app changes done
```

Database migrations (after schema changes: `npm run db:generate`, commit SQL, then):

```bash
npm run db:migrate
```

If the journal is out of sync with an already-migrated DB, see **`docs/db-migrate-root-cause.md`** and `npm run db:repair-journal`. Use `DATABASE_URL_UNPOOLED` when tooling needs TCP — see `drizzle.config.ts` and `.cursor/rules/database-migrations.mdc`.

**Useful scripts** (see `package.json`): `compress:video-archive`, `debug:hero-dom`, `debug:hero-refresh-timeline`, and one-off tools under `scripts/` (e.g. `migrate-videos-to-r2.mjs` — documented in the video handover).

## Deploy

Do not push or deploy from automation unless explicitly requested.
