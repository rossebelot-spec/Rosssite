# Literary Section & Works Hub Thumbnails — Plan

## Overview

Three things to build, all requiring DB migrations → hand to Claude Code:

1. **Works hub thumbnails** — admin-managed images for the 3 category cards
2. **Books** — a new table + admin + public section on `/literary`
3. **Literary publications** — a new table + admin + public section on `/literary`

After implementation, all content can be populated directly from research.

---

## Part 1: Works Hub Thumbnails

### The problem
`/work` has 3 static cards (Commentary, Essays, Literary). The card component already has
`thumbnailSrc?: string` wired up — it just has no source.

### Proposed solution: `site_settings` key/value table

A minimal key/value store for site-wide config. Three rows cover all three cards.

```sql
CREATE TABLE site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- seed rows
INSERT INTO site_settings (key) VALUES
  ('works_hub_commentary_image'),
  ('works_hub_essays_image'),
  ('works_hub_literary_image');
```

### Admin page: `/admin/settings/works-hub`

A single page with three image upload slots (one per card), using the existing Vercel Blob
upload pattern already in the photography admin. On save, upserts into `site_settings`.

### Works page change

`/app/work/page.tsx` becomes async — queries `site_settings` for the three keys and
passes the values as `thumbnailSrc` to the existing card renderer. No other UI change.

---

## Part 2: Books

### New table: `books`

```sql
CREATE TABLE books (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  subtitle       TEXT NOT NULL DEFAULT '',
  publisher      TEXT NOT NULL,
  year           INTEGER NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  buy_url        TEXT,
  isbn           TEXT NOT NULL DEFAULT '',
  display_order  INTEGER NOT NULL DEFAULT 0,
  published      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Admin page: `/admin/books`

List + new/edit, same pattern as Videos or Collections. Fields: title, publisher, year,
description, cover image upload (Vercel Blob), buy link, ISBN, display order, published toggle.

### Content ready to enter

| Title | Publisher | Year | Notes |
|---|---|---|---|
| Swimming in the Dark | Black Moss Press | 2008 | First collection. Developed at Banff Centre's Wired Writing Studio (2006). |
| Nothing Bothers to Remain | Wolsak & Wynn | ~2020 | Longlisted for 2018 CBC Poetry Prize. **Verify exact year.** |
| Moving to Climate Change Hours | Wolsak & Wynn | 2020 | Named one of best poetry collections of 2020 by CBC. One of eleven books on climate crisis by Shondaland. |

Cover images: fetch from publisher pages (Wolsak & Wynn bookstore, Amazon) or rossbelot.com.

---

## Part 3: Literary Publications

### The concept

A calendar-style record of appearances in journals, anthologies, translations, and
prize shortlists — same rhythm as `site_events` but for literary milestones.

### New table: `literary_publications`

```sql
CREATE TABLE literary_publications (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,          -- poem/piece title or anthology title
  publication   TEXT NOT NULL,          -- journal, anthology, prize name
  date          TEXT NOT NULL,          -- ISO date YYYY or YYYY-MM-DD
  kind          TEXT NOT NULL DEFAULT 'journal',  -- journal | anthology | translation | prize
  url           TEXT,                   -- link to read/buy if available
  description   TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Admin page: `/admin/literary-publications`

List + new/edit. Fields: title, publication name, date, kind (dropdown), URL, description,
published toggle. Same patterns as the news or events admin.

### Content ready to enter (from research)

| Title / Piece | Publication | Year | Kind |
|---|---|---|---|
| "O'Hare, Terminal Two, Concourse E, Gate E1" | Best Canadian Poetry in English | 2013 | anthology |
| "The Edge of Everything" | CBC Poetry Prize — shortlist | 2016 | prize |
| "Nothing Bothers to Remain" | CBC Poetry Prize — longlist | 2018 | prize |
| "achievement" | Montreal International Poetry Prize — finalist | TBD | prize |
| Paul Éluard translations ("Nuits partagées" etc.) | Delos: A Journal of Translation and World Literature | TBD | translation |
| Paul Éluard translations | Denver Quarterly | TBD | translation |
| Paul Éluard — four poems (with Sara Burant) | Periodicities: A Journal of Poetry and Poetics | 2025 | translation |
| Video poem "What Would I Say Then" | 9th International Video Poetry Festival, Athens | 2020 | award |

**Needs verification:** exact dates and piece titles for Delos, Denver Quarterly, and the
Montreal prize. A closer read of rossbelot.com/about or publisher pages should confirm.

---

## Part 4: Redesigned `/literary` Page

Replace the current "essays tagged literary" logic with two sections:

```
Literary
├── Books
│   [Cover art grid — links to buy]
├── In Print
│   [Timeline list of journal/anthology appearances by kind/year]
```

The "essays tagged literary" query can be removed entirely (those essays still live
on `/essays`). The literary tag on essays becomes redundant once this section exists.

---

## Part 5: Sidebar updates

Under **Works** in `app/admin/layout.tsx`, add:

```
WORKS
Essays & Blog
Op-eds
Books           ← new
Publications    ← new
```

Add a **Settings** group (or add it to the existing About section):
```
SETTINGS
Works Hub       ← new (for the 3 thumbnail images)
```

---

## Execution order for Claude Code

1. Write migration SQL for `site_settings`, `books`, `literary_publications`
2. Run `drizzle-kit generate` + `migrate`
3. Build admin pages: `/admin/books`, `/admin/literary-publications`, `/admin/settings/works-hub`
4. Update sidebar
5. Redesign `/app/literary/page.tsx`
6. Update `/app/work/page.tsx` to pull thumbnails from `site_settings`
7. Populate content (can be done here in Cowork after admin pages exist)

---

## What can be done here vs Claude Code

| Task | Where |
|---|---|
| DB migrations + schema | Claude Code |
| Admin page code | Claude Code |
| Public page redesign | Claude Code |
| Content entry (books, publications) | Here (Cowork), after admin pages built |
| Book cover images | Here (Cowork) — fetch from publisher sites |
| Works hub thumbnails | Here (Cowork) — source images after admin is built |
