# Online Readings feature — all steps complete

All 8 steps of the approved plan have been executed.

## Changes made

**Migration (done in previous session):**
- `db/migrations/0019_online_readings.sql` — CREATE TABLE for `online_readings`
- `db/migrations/meta/_journal.json` — idx 19 entry added

**Schema (`db/schema.ts`):**
- Added `onlineReadings` Drizzle table definition matching the migration
- Exported `OnlineReading` and `NewOnlineReading` inferred types

**Happenings tabs (`components/happenings/happenings-tabs.tsx`):**
- `HappeningsTab` type extended to `"news" | "events" | "readings"`
- Third tab link added: `?tab=readings` → "Readings"

**Happenings page (`app/happenings/page.tsx`):**
- Handles `tab === "readings"` in both metadata and render
- Imports and renders `<OnlineReadingsIndex />` for the readings tab

**Public display component (`components/happenings/online-readings-index.tsx`):**
- Server component; queries `online_readings WHERE published = true ORDER BY date DESC`
- Shows thumbnail (auto-derived from YouTube video ID if not stored), platform badge, title linked to external URL or R2 URL, optional description
- Card layout with thumbnail + text side by side

**Server actions (`lib/server-actions/online-readings.ts`):**
- `createOnlineReading`, `updateOnlineReading`, `publishOnlineReading`, `deleteOnlineReading`
- Re-exported from `lib/actions.ts`

**Admin API route (`app/api/admin/online-readings/[id]/route.ts`):**
- GET endpoint for editor page to load existing row

**Admin pages:**
- `app/admin/online-readings/page.tsx` — list view with date, platform badge, published status
- `app/admin/online-readings/[id]/page.tsx` — editor with platform radio (YouTube / TikTok / R2), URL fields, thumbnail, description, Publish/Unpublish/Delete

**Sidebar (`app/admin/layout.tsx`):**
- "Online Readings" link added under Happenings group

**Seed script (`scripts/seed-online-readings.mjs`):**
- Seeds 3 known readings as drafts (YouTube Invisible Flock reading, Maclean's TikTok, NAC YouTube reading)
- Vimeo video noted in a comment — add R2 URL once upload tool is configured

## What you need to run locally

```bash
# 1. Run the migration (creates online_readings table)
npm run db:migrate

# 2. Seed the 3 known readings (as drafts — publish via admin)
node scripts/seed-online-readings.mjs

# 3. Pending from prior session:
node scripts/seed-news-coverage.mjs
node scripts/seed-geosi-reads-interview.mjs
node scripts/seed-hamilton-arts-week-event.mjs
node scripts/seed-litlive-event.mjs
node scripts/seed-press-from-old-site.mjs
```

After seeding, visit `/admin/online-readings` to review and publish. The Readings tab will appear on `/happenings` immediately once the migration runs (shows "No readings posted yet" until items are published).

TASK COMPLETE
