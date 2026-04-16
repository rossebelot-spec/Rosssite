# Video platform — architecture plan

**Source of truth:** `db/schema.ts` and the live routes under `app/video/` and `app/admin/videos/`.

The database uses a **`videos`** table (not `video_poems`). Prose links use **`content_links.video_id`**. **`collection_items`** stores polymorphic **`linked_type` / `linked_id`** (`video` \| `photo`). **`videos.published`** controls visibility on `/video`. Admin UI lives at **`/admin/videos`** and **`/admin/collections`**. Public URLs: `/video`, `/video/collections/[slug]`, with `?poem=` selecting the active piece.

Sections below retain **historical** naming and file paths from the original plan. When they disagree with the repo, **trust the code.**

---

## Implementation Notes for Agents

- Build the schema first, run the migration, then work through the file list top to bottom
- The TipTap editor has a known initialization corruption issue — see the existing `onUpdate` guard in `tiptap-editor.tsx`. Give all TipTap instances distinct `key` props (e.g. `content-${id}`, `collection-intro-${id}`). Do not modify the `onUpdate` handler.
- `/api/admin/**` routes must authenticate — use `requireApiSession()` from `lib/api-auth.ts` (or `await auth()`); the proxy matcher only covers `/admin`, not `/api/admin`.
- No drag-and-drop — use up/down arrow buttons for collection item reordering. Do not add `@dnd-kit` or any other DnD library.
- Do not make any changes until a plan has been confirmed for each section. Do not push to GitHub or deploy to Vercel.

---

## 1. Drizzle Schema

`db/schema.ts` defines `photos`, **`videos`**, **`collections`**, **`collection_items`**, unified **`content`** / **`content_links`**, **`gallery_photos`**, and op-ed tables. After schema edits: `npm run db:generate`, commit generated SQL, then **`npm run db:migrate`** (see `docs/db-migrate-root-cause.md` if the journal drifts).

### `videos` (historical doc referred to this as `video_poems`)

Long-form essay HTML is **not** stored on this table. It lives in **`content.body_html`** and is associated via **`content_links`** (`video_id`). The public collection reader joins those rows when building the essay pane beside the native video player.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | primary key |
| `title` | `text` | not null |
| `slug` | `text` | not null, unique — used as `?poem=` key and in admin URLs |
| `r2_url` | `text` | nullable in DB; **required in app** — public HTTPS URL to the MP4 (e.g. Cloudflare R2) |
| `thumbnail_url` | `text` | not null, default `""` — Vercel Blob URL, 16:9 aspect ratio |
| `thumbnail_alt` | `text` | not null, default `""` |
| `description` | `text` | not null, default `""` — short lede for meta/listings |
| `duration_seconds` | `integer` | nullable |
| `is_featured_for_home` | `boolean` | not null, default false — at most one `true`; home hero featured player |
| `published` | `boolean` | not null, default false — gates `/video` listings and poem pages |
| `published_at` | `timestamp` | nullable |
| `created_at` | `timestamp` | not null, defaultNow |
| `updated_at` | `timestamp` | not null, defaultNow |

Indexes: unique on `slug`.

### `content` (unified prose)

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | primary key |
| `type` | `text` | not null — e.g. `essay`, `review`, `blog`, `news`, `event` |
| `title`, `slug` | `text` | slug unique |
| `topic` | `text` | not null, default `""` |
| `body_html` | `text` | TipTap HTML; same reading typography as public essay pages |
| `description` | `text` | not null, default `""` |
| `tags` | `text[]` | not null, default `[]` |
| `published` | `boolean` | not null, default false |
| `published_at` | `timestamp` | nullable |
| `created_at` / `updated_at` | `timestamp` | not null, defaultNow |

Index: `content_type_idx` on `type`.

### `content_links`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | primary key |
| `content_id` | `integer` | not null, FK → `content.id`, on delete cascade |
| `video_id` | `integer` | nullable, FK → `videos.id`, on delete cascade |
| `collection_id` | `integer` | nullable, FK → `collections.id`, on delete cascade |
| `created_at` | `timestamp` | not null, defaultNow |

At most one of `video_id` / `collection_id` may be set per product rule (enforced in app logic). Used to attach an essay (or other prose) to a video for the collection reader.

### `collections`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | primary key |
| `title` | `text` | not null |
| `slug` | `text` | not null, unique — the URL segment, e.g. `/video/collections/mtcch` |
| `media_type` | `text` | not null, default `video` — `video` vs `photo` sets (multimedia labelling) |
| `intro_html` | `text` | not null, default `""` — TipTap-edited intro text |
| `description` | `text` | not null, default `""` — short description for listing + OG meta |
| `cover_image_url` | `text` | nullable — optional cover for collection index |
| `published` | `boolean` | not null, default false |
| `published_at` | `timestamp` | nullable |
| `display_order` | `integer` | not null, default 0 — order on `/video` landing page |
| `created_at` | `timestamp` | not null, defaultNow |
| `updated_at` | `timestamp` | not null, defaultNow |

Indexes: unique on `slug`.

### `collection_items` (join table with ordering)

Polymorphic: one row per (collection, linked asset). **`linked_type`** is `video` or `photo`; **`linked_id`** is the row id in that table. Ordering is per-collection.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | primary key |
| `collection_id` | `integer` | not null, FK → `collections.id`, on delete cascade |
| `linked_type` | `text` | e.g. `video`, `photo` |
| `linked_id` | `integer` | not null — id in `videos` or photos table per `linked_type` |
| `position` | `integer` | not null, default 0 — ordering within the collection |
| `created_at` | `timestamp` | not null, defaultNow |

Indexes include uniqueness on `(collection_id, linked_type, linked_id)` and indexes for ordered reads. **Admin** can attach **video** or **photo** items depending on collection `media_type` and editor wiring — confirm `app/admin/collections/` and API routes for the current behaviour.

### Relations (see `db/schema.ts`)

- `collectionsRelations`: `items: many(collectionItems)`
- `collectionItemsRelations`: `collection: one(collections, …)` (videos/photos are resolved by `linked_type` + `linked_id` in queries, not separate Drizzle relations on `videos`)
- `contentRelations`: `links: many(contentLinks)`
- `contentLinksRelations`: `content`, `video` (→ `videos`), `collection`
- `galleryPhotosRelations`: empty placeholder (optional future links)

### Inferred types to export

- `Video`, `NewVideo` (inferred types in `schema.ts`)
- `Collection`, `NewCollection`
- `CollectionItem`, `NewCollectionItem`
- `Content`, `NewContent`, `ContentLink`, `NewContentLink`

---

## 2. Admin Page Structure and Routes

Follow the same client-editor + server-action pattern as **`/admin/content`** (unified prose). The admin sidebar includes **Videos**, **Collections**, **Gallery**, **Photography**, and other editorial tools (see `app/admin/layout.tsx`).

```
app/admin/
  videos/
    page.tsx          # list all poems, table style, link to edit, small thumbnail
    [id]/
      page.tsx        # editor: title, slug (auto-slugified on new), hosted HTTPS MP4 URL +
                      # live <video> preview, thumbnail (ImageUploader → Vercel Blob),
                      # description, published, featured-for-home; link essay via content + content_links.
                      # id === "new" = create mode.
  collections/
    page.tsx          # list with item count + published badge + New Collection link
    [id]/
      page.tsx        # metadata + TipTap intro + item picker/reorder panel

app/api/admin/
  videos/
    route.ts          # GET: list all poems (used by collection editor picker)
    [id]/route.ts     # GET: single poem for editor
  collections/
    [id]/route.ts     # GET: collection + ordered items with joined poem data
```

### What each page does

**`/admin/videos` (list)** — server component, `force-dynamic`. Lists videos ordered by `created_at desc`. **New** → `/admin/videos/new`.

**`/admin/videos/[id]` (editor)** — client component. Fields: title, slug, hosted HTTPS MP4 URL (R2 or similar), thumbnail upload (ImageUploader → Vercel Blob, crop to 16:9), description; optional link to an existing essay (`content` row) via `content_links`. Renders a live `<video>` preview when `r2_url` is set. Save calls `createVideo` or `updateVideo`. Delete calls `deleteVideo`. Long-form HTML is edited under **`/admin/content`**, not inline on the video row.

**`/admin/collections` (list)** — server component. Shows title, slug, item count (aggregate join), published state, `display_order`.

**`/admin/collections/[id]` (editor)** — client component with two sections:
1. Metadata + intro: title, slug, description, cover image (optional ImageUploader), published toggle, `display_order`, TipTap intro editor (key={`collection-intro-${id}`}).
2. Item picker/reorder: left column = all library poems with "+ Add" buttons; right column = current ordered items with remove + up/down arrow controls. Each change calls a server action immediately.

**API routes** — each handler must authenticate (e.g. `requireApiSession()` from `lib/api-auth.ts` or `await auth()`). **`proxy.ts` does not cover `/api/admin/*`** — handlers must check the session explicitly.

---

## 3. Server Actions

All live in `lib/actions.ts`, each starting with `await requireAdmin()`. Each action revalidates affected public paths.

### Content actions (unified prose + links)

Includes `createContent`, `updateContent`, `deleteContent`, `addContentLink`, `removeContentLink` — insert/update `content`, manage `content_links`, and revalidate `/essays`, `/book-reviews`, and any `/video/collections/...` pages affected by linked poems.

### Video actions

| Action | Inputs | Effect |
|---|---|---|
| `createVideo(data)` | `{ title, slug, r2Url, thumbnailUrl?, thumbnailAlt?, description?, durationSeconds?, published?, … }` | Insert row, revalidate `/video`, redirect to `/admin/videos/${id}` |
| `updateVideo(id, data)` | partial of above (includes `published`, `isFeaturedForHome`, etc.) | Update row, revalidate `/video` + home + every collection page containing it |
| `deleteVideo(id)` | `id` | Look up affected collection slugs → delete row (cascade) → revalidate all → redirect to `/admin/videos` |

### Collection actions

| Action | Inputs | Effect |
|---|---|---|
| `createCollection(data)` | `{ title, slug, mediaType?, description, introHtml, coverImageUrl?, published, publishedAt?, displayOrder? }` | Insert, revalidate `/video` + `/multimedia`, redirect to `/admin/collections/${id}` |
| `updateCollection(id, data)` | partial of above | Update, revalidate `/video` + `/multimedia` + `/video/collections/${slug}` |
| `deleteCollection(id)` | `id` | Look up slug → delete (cascade) → revalidate → redirect to `/admin/collections` |
| `addVideoToCollection({ collectionId, videoId })` | — | Insert join row with `position = max + 1`, revalidate collection page |
| `removeVideoFromCollection({ collectionId, videoId })` | — | Delete join row, re-normalize positions, revalidate collection page |
| `reorderCollectionItems({ collectionId, orderedVideoIds })` | `number[]` | Parallel `UPDATE`s on positions (Neon HTTP driver: no `db.transaction()`), revalidate collection page |

### Internal helper (not exported)

`getCollectionSlugsForVideo(videoId)` — used by `updateVideo` and `deleteVideo` to determine which public paths to revalidate.

---

## 4. Public Page Structure

**URL pattern:** `/video/collections/[slug]?poem=[poemSlug]`

A query param keeps the sidebar mounted across poem switches — no full page replace, no layout shift. No `poem` param = show collection intro in main pane.

```
app/video/
  page.tsx                         # /video — landing: grid of published collections
  collections/
    [slug]/
      page.tsx                     # server component — reads slug + searchParams
      not-found.tsx

components/video/
  collection-reader.tsx            # client wrapper: manages active poem state
  collection-sidebar.tsx           # sticky sidebar: thumbnails + titles
  video-main.tsx              # main pane: native video + title + essay
  video-essay.tsx             # essay HTML renderer (reuses reading typography classes)
```

### Page details

**`app/video/page.tsx`** — server component. Queries `collections` where `published = true`, ordered by `display_order`. Renders collection cards linking to `/video/collections/[slug]`.

**`app/video/collections/[slug]/page.tsx`** — server component.
- Props: `{ params: Promise<{ slug: string }>, searchParams: Promise<{ poem?: string }> }`.
- Fetches collection by slug (published only) with ordered items joined to `videos`. Calls `notFound()` if missing.
- Determines active poem: if no `poem` param show intro; otherwise find item with matching slug, fall back to first.
- Renders `<CollectionReader collection={...} items={...} activeSlug={...} />`.
- `generateMetadata` returns active poem's title/description/thumbnail for correct OG share previews.

### Component notes

**`collection-sidebar.tsx`** — renders `<Link href={`?poem=${poem.slug}`} scroll={false}>` for each item. Highlights the active slug. Shows thumbnail (`next/image`, Vercel Blob, 16:9) + title + optional duration. On mobile (below `md`) stacks above main content.

**`collection-reader.tsx`** — CSS grid layout: sticky sidebar + scrollable main area. Sidebar uses `position: sticky` with **`top: var(--site-header-height)`** (not `position: fixed`) so it sits below the site nav. Desktop only — below `md` sidebar stacks above main content.

**`video-main.tsx`** — Native `<video src={r2Url}>` for the public HTTPS MP4 URL. 16:9 aspect ratio wrapper.

**`video-essay.tsx`** — renders joined **`content.body_html`** (linked essay for that poem) using the same reading typography classes as `/essays`. No TipTap on the public side — HTML only.

---

## 5. Decisions Made

1. **Essay storage** — HTML in **`content.body_html`**, linked to a video poem via **`content_links`** when needed; matches site-wide `body_html` / reading CSS.
2. **Reordering** — up/down arrow buttons for MVP. No drag-and-drop libraries.
3. **Published state** — `videos.published` controls visibility on `/video`; collections are separate.
4. **API route auth** — explicit session check in every `/api/admin/**` handler. **`proxy.ts`** does not cover these routes.
5. **Revalidation fan-out** — `updateVideo` / `deleteVideo` must revalidate all collection pages containing the poem via `getCollectionSlugsForVideo`.
6. **Native video** — `r2_url` is the only playback source; not an iframe embed.
7. **Thumbnail aspect ratio** — 16:9. Enforce on upload.
8. **Auto-fetch host metadata** — out of scope for MVP.
9. **Mobile sidebar** — below `md`, stack items list above main content.
10. **Migration order** — schema first, migration applied, then all other files.
11. **Retire `data/videos.ts`** — check current contents, seed DB from it if it contains MtCCH data, then delete the file.
12. **TipTap key props** — e.g. `key={`collection-intro-${id}`}` on the collection intro editor; use distinct keys for any TipTap instance. Required to prevent initialization corruption (see `tiptap-editor.tsx`).
13. **Slug namespace** — `videos.slug` and `collections.slug` live in different URL contexts, collisions are harmless.

---

## 6. Complete File List

Files to create or modify, in implementation order (the repo may already contain many of these from earlier work):

1. `db/schema.ts` — `videos`, `collections`, `collection_items`, unified `content`, `content_links`, `gallery_photos`, relations, inferred types
2. Run `npm run db:generate`, commit SQL, then `npm run db:migrate`
3. `lib/actions.ts` — re-exports from `lib/server-actions/*` (content, videos, collections, etc.), including `getCollectionSlugsForVideo`
4. `app/admin/layout.tsx` — nav: Dashboard, Content, Photography, Gallery, Videos, Video compress, Collections, static editorial pages (see file for full list)
5. `app/admin/content/page.tsx`, `app/admin/content/[id]/page.tsx` — unified prose admin
6. `app/api/admin/content/[id]/route.ts` — load single content row for editor
7. `app/admin/videos/page.tsx`, `app/admin/videos/[id]/page.tsx`
8. `app/admin/collections/page.tsx`, `app/admin/collections/[id]/page.tsx`
9. `app/api/admin/videos/route.ts`, `app/api/admin/videos/[id]/route.ts`
10. `app/api/admin/collections/[id]/route.ts`
11. `components/video/*` — collection reader, sidebar, main embed, essay HTML renderer
12. `app/video/page.tsx`, `app/video/collections/[slug]/page.tsx`, `not-found.tsx`
13. `data/videos.ts` — retire per decision §5.11 when migrated