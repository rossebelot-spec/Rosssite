# Ross Belot — personal site

Next.js **16** (App Router), **React 19**, **TypeScript**. Content is split between **Neon Postgres** (Drizzle ORM) and static lists under `data/*.ts` — see `.cursorrules` for the authoritative stack and conventions.

## Stack (short)

- **DB:** Drizzle + `@neondatabase/serverless` (HTTP driver — do not use `db.transaction()` in app code)
- **Auth:** NextAuth v5 (Google); `/admin/*` gated via `proxy.ts`; `/api/admin/*` handlers authenticate explicitly
- **Assets:** Vercel Blob for uploads; video may reference R2 URLs where stored in schema
- **UI:** Tailwind v4 (`app/globals.css` tokens), shadcn-style components, TipTap in admin
- **Docs:** `AGENTS.md` (Next 16 vs training data), `docs/tiptap-editor.md` (editor toolbar), `videoplan.md` (video/collections — cross-check with `db/schema.ts`)

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # required before considering changes done
```

Database migrations (after schema changes):

```bash
npm run db:migrate
```

Use `DATABASE_URL_UNPOOLED` when the Drizzle CLI needs TCP — see `drizzle.config.ts` and `.cursor/rules/database-migrations.mdc`.

## Deploy

Do not push or deploy from automation unless explicitly requested.
