# Video Poem Platform — Architecture Plan

## Implementation Notes for Agents

- Build the schema first, run the migration, then work through the file list top to bottom
- The TipTap editor has a known initialization corruption issue — see the existing `onUpdate` guard in `tiptap-editor.tsx`. Give all TipTap instances distinct `key` props (`video-poem-${id}` and `collection-intro-${id}`). Do not modify the `onUpdate` handler.
- `/api/admin/**` routes must call `await auth()` manually — the middleware matcher only covers `/admin`, not `/api/admin`. Easy to forget, do not skip it.
- No drag-and-drop — use up/down arrow buttons for collection item reordering. Do not add `@dnd-kit` or any other DnD library.
- Do not make any changes until a plan has been confirmed for each section. Do not push to GitHub or deploy to Vercel.

---

## 1. Drizzle Schema

Three tables extend `db/schema.ts`. Run `npm run db:generate` and apply the migration before writing any other code.

### `video_poems`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | primary key |
| `title` | `text` | not null |
| `slug` | `text` | not null, unique — used as `?poem=` key and in admin URLs |
| `vimeo_id` | `text` | not null — bare numeric ID, NOT a full URL |
| `thumbnail_url` | `text` | not null, default `""` — Vercel Blob URL, 16:9 aspect ratio |
| `thumbnail_alt` | `text` | not null, default `""` |
| `essay_html` | `text` | not null, default `""` — TipTap output HTML, matches `body_html` convention |
| `description` | `text` | not null, default `""` — short lede for meta/listings |
| `duration_seconds` | `integer` | nullable |
| `created_at` | `timestamp` | not null, defaultNow |
| `updated_at` | `timestamp` | not null, defaultNow |

Indexes: unique on `slug`.

### `collections`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | primary key |
| `title` | `text` | not null |
| `slug` | `text` | not null, unique — the URL segment, e.g. `/video/collections/mtcch` |
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

One row per (collection, videoPoem) pair. Carries per-collection ordering so one poem can appear in multiple collections at different positions.

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | primary key |
| `collection_id` | `integer` | not null, FK → `collections.id`, on delete cascade |
| `video_poem_id` | `integer` | not null, FK → `video_poems.id`, on delete cascade |
| `position` | `integer` | not null, default 0 — ordering within the collection |
| `created_at` | `timestamp` | not null, defaultNow |

Indexes:
- Unique composite on `(collection_id, video_poem_id)` — a poem appears at most once per collection
- Index on `(collection_id, position)` — fast ordered reads
- Index on `video_poem_id` — fast "where does this poem appear" lookups

### Relations to export

- `collectionsRelations`: `items: many(collectionItems)`
- `videoPoemsRelations`: `items: many(collectionItems)`
- `collectionItemsRelations`: `collection: one(collections, …)`, `videoPoem: one(videoPoems, …)`

### Inferred types to export

- `VideoPoem`, `NewVideoPoem`
- `Collection`, `NewCollection`
- `CollectionItem`, `NewCollectionItem`

---

## 2. Admin Page Structure and Routes

Mirrors the existing `app/admin/essays/**` pattern. Add two nav links to `app/admin/layout.tsx`: `Video Poems` → `/admin/video-poems` and `Collections` → `/admin/collections`.

```
app/admin/
  video-poems/
    page.tsx          # list all poems, table style, link to edit, small thumbnail
    [id]/
      page.tsx        # editor: title, slug (auto-slugified on new), vimeoId input +
                      # live iframe preview, thumbnail (ImageUploader → Vercel Blob),
                      # description, TipTap essay. id === "new" = create mode.
  collections/
    page.tsx          # list with item count + published badge + New Collection link
    [id]/
      page.tsx        # metadata + TipTap intro + item picker/reorder panel

app/api/admin/
  video-poems/
    route.ts          # GET: list all poems (used by collection editor picker)
    [id]/route.ts     # GET: single poem for editor
  collections/
    [id]/route.ts     # GET: collection + ordered items with joined poem data
```

### What each page does

**`/admin/video-poems` (list)** — server component, `force-dynamic`. Selects all poems ordered by `created_at desc`. "New Video Poem" → `/admin/video-poems/new`.

**`/admin/video-poems/[id]` (editor)** — client component. Fields: title, slug, Vimeo ID (text input, hint "bare numeric ID only"), thumbnail upload (ImageUploader → Vercel Blob, crop to 16:9), description, essay (TipTap, key={`video-poem-${id}`}). Renders a live `<iframe>` preview once `vimeo_id` is set — embed URL format: `https://player.vimeo.com/video/${vimeoId}?dnt=1&title=0&byline=0&portrait=0`. Save calls `createVideoPoem` or `updateVideoPoem`. Delete calls `deleteVideoPoem`.

**`/admin/collections` (list)** — server component. Shows title, slug, item count (aggregate join), published state, `display_order`.

**`/admin/collections/[id]` (editor)** — client component with two sections:
1. Metadata + intro: title, slug, description, cover image (optional ImageUploader), published toggle, `display_order`, TipTap intro editor (key={`collection-intro-${id}`}).
2. Item picker/reorder: left column = all library poems with "+ Add" buttons; right column = current ordered items with remove + up/down arrow controls. Each change calls a server action immediately.

**API routes** — each handler must call `await auth()` and return 401 if no session. Do not rely on middleware for these routes.

---

## 3. Server Actions

All live in `lib/actions.ts`, each starting with `await requireAdmin()`. Each action revalidates affected public paths.

### Video poem actions

| Action | Inputs | Effect |
|---|---|---|
| `createVideoPoem(data)` | `{ title, slug, vimeoId, thumbnailUrl, thumbnailAlt, description, essayHtml, durationSeconds? }` | Insert row, revalidate `/video`, redirect to `/admin/video-poems/${id}` |
| `updateVideoPoem(id, data)` | partial of above | Update row, revalidate `/video` + every collection page containing it |
| `deleteVideoPoem(id)` | `id` | Look up affected collection slugs → delete row (cascade) → revalidate all → redirect to `/admin/video-poems` |

### Collection actions

| Action | Inputs | Effect |
|---|---|---|
| `createCollection(data)` | `{ title, slug, description, introHtml, coverImageUrl?, published, publishedAt?, displayOrder? }` | Insert, revalidate `/video`, redirect to `/admin/collections/${id}` |
| `updateCollection(id, data)` | partial of above | Update, revalidate `/video` + `/video/collections/${slug}` |
| `deleteCollection(id)` | `id` | Look up slug → delete (cascade) → revalidate → redirect to `/admin/collections` |
| `addVideoPoemToCollection({ collectionId, videoPoemId })` | — | Insert join row with `position = max + 1`, revalidate collection page |
| `removeVideoPoemFromCollection({ collectionId, videoPoemId })` | — | Delete join row, re-normalize positions, revalidate collection page |
| `reorderCollectionItems({ collectionId, orderedVideoPoemIds })` | `number[]` | Bulk UPDATE positions in a single `$transaction`, revalidate collection page |

### Internal helper (not exported)

`getCollectionSlugsContainingPoem(poemId)` — used by `updateVideoPoem` and `deleteVideoPoem` to determine which public paths to revalidate.

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
  video-poem-main.tsx              # main pane: Vimeo iframe + title + essay
  video-poem-essay.tsx             # essay HTML renderer (reuses reading typography classes)
```

### Page details

**`app/video/page.tsx`** — server component. Queries `collections` where `published = true`, ordered by `display_order`. Renders collection cards linking to `/video/collections/[slug]`.

**`app/video/collections/[slug]/page.tsx`** — server component.
- Props: `{ params: Promise<{ slug: string }>, searchParams: Promise<{ poem?: string }> }`.
- Fetches collection by slug (published only) with ordered items joined to `video_poems`. Calls `notFound()` if missing.
- Determines active poem: if no `poem` param show intro; otherwise find item with matching slug, fall back to first.
- Renders `<CollectionReader collection={...} items={...} activeSlug={...} />`.
- `generateMetadata` returns active poem's title/description/thumbnail for correct OG share previews.

### Component notes

**`collection-sidebar.tsx`** — renders `<Link href={`?poem=${poem.slug}`} scroll={false}>` for each item. Highlights the active slug. Shows thumbnail (`next/image`, Vercel Blob, 16:9) + title + optional duration. On mobile (below `md`) stacks above main content.

**`collection-reader.tsx`** — CSS grid layout: sticky sidebar + scrollable main area. Sidebar uses `position: sticky; top: 0; height: 100dvh` (not `position: fixed`) so it coexists with the site nav. Desktop only — below `md` sidebar stacks above main content.

**`video-poem-main.tsx`** — Vimeo embed URL always uses: `https://player.vimeo.com/video/${vimeoId}?dnt=1&title=0&byline=0&portrait=0`. 16:9 aspect ratio wrapper.

**`video-poem-essay.tsx`** — renders `essay_html` using the same reading typography classes as the essay pages. No TipTap on the public side — HTML only.

---

## 5. Decisions Made

1. **Essay storage** — HTML, matching existing `body_html` convention.
2. **Reordering** — up/down arrow buttons for MVP. No drag-and-drop libraries.
3. **Draft state on video poems** — no `published` column on `video_poems`. A poem is implicitly public only if it appears in at least one published collection.
4. **API route auth** — manual `await auth()` in every `/api/admin/**` handler. Middleware does not cover these routes.
5. **Revalidation fan-out** — `updateVideoPoem` / `deleteVideoPoem` must revalidate all collection pages containing the poem via `getCollectionSlugsContainingPoem`.
6. **Vimeo player** — always append `?dnt=1&title=0&byline=0&portrait=0` to embed URLs. Built into `<VideoPoemMain />`, not stored in DB.
7. **Thumbnail aspect ratio** — 16:9. Enforce on upload.
8. **Auto-fetch Vimeo metadata** — out of scope for MVP.
9. **Mobile sidebar** — below `md`, stack items list above main content.
10. **Migration order** — schema first, migration applied, then all other files.
11. **Retire `data/videos.ts`** — check current contents, seed DB from it if it contains MtCCH data, then delete the file.
12. **TipTap key props** — `key={`video-poem-${id}`}` on poem editor, `key={`collection-intro-${id}`}` on collection intro editor. Required to prevent initialization corruption.
13. **Slug namespace** — `video_poems.slug` and `collections.slug` live in different URL contexts, collisions are harmless.

---

## 6. Complete File List

Files to create or modify, in implementation order:

1. `db/schema.ts` — add three tables + relations + inferred types
2. Run `npm run db:generate` and apply migration
3. `lib/actions.ts` — add all server actions + internal helper
4. `app/admin/layout.tsx` — add Video Poems and Collections nav links
5. `app/admin/video-poems/page.tsx` — new
6. `app/admin/video-poems/[id]/page.tsx` — new
7. `app/admin/collections/page.tsx` — new
8. `app/admin/collections/[id]/page.tsx` — new
9. `app/api/admin/video-poems/route.ts` — new
10. `app/api/admin/video-poems/[id]/route.ts` — new
11. `app/api/admin/collections/[id]/route.ts` — new
12. `components/video/collection-sidebar.tsx` — new
13. `components/video/video-poem-essay.tsx` — new
14. `components/video/video-poem-main.tsx` — new
15. `components/video/collection-reader.tsx` — new
16. `app/video/page.tsx` — replace static version
17. `app/video/collections/[slug]/page.tsx` — new
18. `app/video/collections/[slug]/not-found.tsx` — new
19. `data/videos.ts` — delete after seeding DB