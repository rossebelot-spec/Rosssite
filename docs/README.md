# Documentation index

Handover and reference docs for this repo. When a doc disagrees with **`db/schema.ts`** or the live routes under **`app/`**, trust the code.

| File | Topic |
|------|--------|
| **`handover-video-r2-pipeline.md`** | Self-hosted video on R2: `videos.r2_url`, admin paste-URL workflow, `migrate-videos-to-r2.mjs`, compress script, GitHub Actions plan workflow |
| **`handover-hero-nav-layout.md`** | Home hero min-height, `--site-header-height`, `Nav` ResizeObserver + `#site-header-height-live`, Playwright debug scripts |
| **`handover-home-featured-video-hero.md`** | Featured clip in hero vs copy column; CSS tokens; `is_featured_for_home` |
| **`db-migrate-root-cause.md`** | Drizzle journal drift vs Neon; why `drizzle-kit migrate` can hide SQL errors; this repo’s `npm run db:migrate` |
| **`tiptap-editor.md`** | Admin TipTap toolbar (fonts, spacing, lists, etc.) |

Related outside this folder: **`AGENTS.md`** (Next 16), **`videoplan.md`** (video/collections plan), **`.cursorrules`** (project rules).
