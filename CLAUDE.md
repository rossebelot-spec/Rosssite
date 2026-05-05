@AGENTS.md

## Deployment

Do not create PRs or work in separate branches unless explicitly asked. Always test locally first before pushing.

## Project Context

This is a Next.js site for Ross Belot (writer, poet, environmental journalist).
Public sections include essays, book reviews, news, events, **video** (native MP4
from hosted URLs, often **Cloudflare R2**, with **collections**), **multimedia**
landing, **photography** sets, **gallery** (mosaic from `gallery_photos`), op-eds
(with publication collections), press, and about.

Stack: Next.js 16 App Router, React 19, Drizzle ORM, Neon Postgres
(`@neondatabase/serverless` HTTP driver — no `db.transaction()` in app code),
NextAuth v5 (Google), Vercel Blob for typical uploads, TipTap in admin, Tailwind v4.
**Access control:** `proxy.ts` for `/admin/*` (not a `middleware.ts` file). **Video
URLs** live in `videos.r2_url`; admin accepts a **paste public HTTPS MP4 URL**
(presigned browser upload to R2 is not implemented yet — see
`docs/handover-video-r2-pipeline.md`).

Key conventions:
- DB-backed content uses Drizzle; server actions are re-exported from `lib/actions.ts`
- Thumbnails and many images use Vercel Blob URLs; large gallery stills / video files
  may use R2 public URLs stored in the schema
- Admin at `/admin/*` (Dashboard, Content, Photography, Gallery, Videos, Collections, etc.)
- Never push to GitHub or deploy to Vercel unless explicitly asked
