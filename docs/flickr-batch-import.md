# Flickr Batch Import

How to import a curated set of Flickr photos into a site collection.
Used first in April 2026 to create the **Interesting Black & White** collection.

---

## Overview

The Flickr data export (50+ ZIPs) lives at `/Volumes/Archive/flickr archive/extracted/`.
A SQLite database built from those JSON files lives at `/Volumes/Archive/flickr_photos.db`.
The import script queries that DB, converts originals to WebP, uploads to Vercel Blob,
and creates a `collections` + `photos` + `collection_items` records in Neon.

---

## Prerequisites

```bash
pip install Pillow psycopg2-binary requests --break-system-packages
```

The script lives in the working session as `flickr_batch_import.py`.
A copy should be kept in `/Volumes/Archive/` alongside the DB.

---

## The SQLite Database

**Location:** `/Volumes/Archive/flickr_photos.db`  
**Rebuilt with:** `/Volumes/Archive/build_flickr_db.py` (~90 seconds)  
**Full docs:** `/Volumes/Archive/FLICKR_DATABASE_README.md`

Key tables: `photos` (23,642 rows), `tags`, `albums`, `geo`.  
Each photo row has: `id`, `name`, `views`, `faves`, `date_taken`, `flickr_url`, `original_url`.

> The SQLite file can't always be opened directly on the Archive volume.
> Copy it locally first if you get I/O errors:
> `cp /Volumes/Archive/flickr_photos.db ~/flickr_photos.db`

---

## How the Ranking Works

The "Interesting B&W" list uses a **combined view+fave rank**:

```python
# Rank all BW-tagged photos separately by views and by faves.
# Average the two ranks. Lower average = better combined standing.
avg_rank = (view_rank + fave_rank) / 2
```

This avoids two failure modes:
- Pure views: includes photos that went viral for the wrong reason (search traffic, external links)
- Pure faves: small audience, high engagement — good photos but few people saw them

The hard intersection (top 100 views ∩ top 100 faves) yielded 46 photos.
The top 25 by combined rank were used.

BW tags matched: `bw`, `b&w`, `blackandwhite`, `black and white`, `blackwhite`, `bnw`, `monochrome`.

---

## Image Processing

- **Max dimension:** 2000px (longest edge), downscaled with LANCZOS
- **Format:** WebP, quality 82
- **Conversion:** Pillow (`PIL.Image`), strips alpha/CMYK, converts to RGB first
- **Result:** originals ranged from 57 KB to 51 MB; WebP outputs were 57–669 KB
- **Total for 25 photos:** 6.2 MB on Vercel Blob

---

## Blob Path Convention

Files are uploaded to: `flickr-bw/{photo_id}-{slug}.webp`

Example:
```
flickr-bw/54721135310-dog-days-of-summer-lake-erie-xEyRVLaLLH9nSBKDoj3gTbc34W2FbU.webp
```

Vercel adds a random suffix automatically (`addRandomSuffix` behaviour via the REST PUT API).

---

## Database Records Created

### `collections`
```
id=7, title="Interesting Black & White", slug="interesting-bw",
media_type="photo", published=true
cover_image_url = blob URL of rank-1 photo
```

### `photos`
25 rows inserted with:
- `blob_url` — Vercel Blob URL
- `caption` — `"{title} — {views} views, {faves} faves on Flickr"`
- `alt` — photo title
- `taken_at` — parsed from Flickr `date_taken`
- `display_order` — 0–24 (combined-rank order)

### `collection_items`
25 rows linking `collection_id=7` → each `photos.id`, `linked_type='photo'`.

---

## Running Again / Different Collections

To create a new Flickr-sourced collection, edit the config block at the top of
`flickr_batch_import.py`:

```python
COLLECTION_TITLE       = "Interesting Black & White"
COLLECTION_SLUG        = "interesting-bw"
COLLECTION_DESCRIPTION = "..."
MAX_PHOTOS             = 25
MAX_PX                 = 2000
WEBP_QUALITY           = 82
BW_TAGS                = ("bw", "b&w", ...)   # or swap for any tag set
```

The script is idempotent on upload (Vercel Blob will create a new file with a new
random suffix each run), but uses `ON CONFLICT DO NOTHING` on the Neon inserts,
so re-running with the same slug won't duplicate the collection — it will find the
existing one and skip creation.

---

## What Was Imported (April 2026)

| # | Title | Views | Faves |
|---|-------|-------|-------|
| 1 | Dog Days of Summer Lake Erie | 4,957 | 155 |
| 2 | Wreck Beach - Vancouver | 2,727 | 14 |
| 3 | Winter on Lake Erie | 2,172 | 13 |
| 4 | where i live | 1,136 | 15 |
| 5 | Vince | 1,146 | 15 |
| 6 | Alberta | 967 | 8 |
| 7 | Pen in BW | 654 | 10 |
| 8 | Tree Over Tunnel Mountain | 643 | 7 |
| 9 | Pen follows in BW | 517 | 7 |
| 10 | Santa Cruz Surfers | 523 | 6 |
| 11 | Bow River Paddle BW | 593 | 5 |
| 12 | Cootes Paradise Thaw in BW | 491 | 7 |
| 13 | Yachats OR King Tide in BW | 500 | 6 |
| 14 | Water Taxis at Sunset Beach | 451 | 9 |
| 15 | Pen looking to herd something | 529 | 5 |
| 16 | Princess Point in the Fog and BW | 494 | 5 |
| 17 | January Thaw in BW | 435 | 7 |
| 18 | Banff - Bow River in BW | 447 | 6 |
| 19 | Beautiful And Scary At The Same Time | 440 | 5 |
| 20 | El Santuario de Chimayo | 446 | 5 |
| 21 | Pen Running in Sepia | 525 | 4 |
| 22 | New Mexico | 472 | 4 |
| 23 | Barn | 402 | 5 |
| 24 | Yachats | 1,236 | 3 |
| 25 | Yachats OR in Sepia | 415 | 5 |
