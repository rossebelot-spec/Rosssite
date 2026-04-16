# Handover: Home featured video (player in hero, copy in grid)

## What this is

On `/`, the **featured clip’s player** renders **inside the home hero**, under the Ross/Belot name stack and roles line, in the **right-hand name column**. The **third column of the row below** (`<main>`) holds only **copy**: section heading “Featured video”, video title, description, credits link, plus sitewide “All video →”.

This split keeps the hero visually connected to the film while essays / op-eds stay in columns 1–2.

## Files (source of truth)

| Piece | Location |
|--------|----------|
| Which row is “featured” | DB: `videos.is_featured_for_home` (at most one `true`; set in **`/admin/videos/[id]`**). `getFeaturedHomeVideo()` selects `is_featured_for_home AND published`. |
| Hero shell + optional player | `components/hero.tsx` — `featuredVideo` prop; `data-hero-featured-video="true\|false"` |
| Player markup only | `components/home-featured-video-player.tsx` — R2 `<video>` (same rules as `VideoMain`) |
| Third column | `components/home-featured-video.tsx` — `HomeFeaturedVideoCopy` |
| Wiring | `app/page.tsx` — loads featured row, passes props to `Hero` + `HomeFeaturedVideoCopy` |
| Size / spacing | `app/globals.css` — tokens below + `.home-hero-featured-player` |

**`/video` index:** `app/video/page.tsx` excludes the **resolved featured row by `id`** (`getFeaturedHomeVideo()`) so the same film is not duplicated in the standalone “Videos” grid.

## Layout structure (DOM)

```
.home-hero-section
  .home-hero-split                    ← 2fr photo | 1fr name (grid)
    .home-hero-name-panel
      .hero-text-stack                 ← flex column; gap = “lower” control #1
        .hero-text-intro               ← name + roles; internal gap = --hero-text-stack-gap
          h1.hero-text-name
          p.hero-text-roles
        .home-hero-featured-player     ← aspect-video box; width = “bigger” control
```

`<main>`: three-column grid; column 3 = `HomeFeaturedVideoCopy` only (no player).

## CSS tokens that control “lower” and “bigger”

All live in `app/globals.css` under `@theme` / `@layer components` next to the other hero variables.

### Vertical: moving the player *down* under the roles line

- **`--hero-featured-after-roles-gap`** — Flex **gap between** `.hero-text-intro` (name + roles) **and** `.home-hero-featured-player`. **Larger value → more empty space above the player → player sits lower** relative to the roles text.

  Current intent: `clamp(1.75rem, 5.25vh, 3.75rem)`.

- **`--hero-text-stack-margin-top`** — Spaces the **whole** stack (intro + player) down from the top of the name panel. Affects both name block and player together, not only the player.

- **`--hero-name-optical-shift`** — `translateY` on `.hero-text-stack`. Moves **intro and player as one**; does not change the gap between roles and player.

So: to move **only** the player down without moving the name block, **raise `--hero-featured-after-roles-gap`**. To move **everything** in the right column down, tweak **`--hero-text-stack-margin-top`** (or panel `--hero-name-panel-padding-block`).

### Horizontal: making the player *bigger*

The player is **not** `width: 100%` of the name column anymore. It is **wider than the text stack**, **right-aligned**, so it extends **left** into the portrait / mask seam (still inside the hero).

- **`--hero-featured-player-width`** — Default: `min(132%, min(54vw, 42rem))`.

  - **`132%`** is relative to the width of `.hero-text-stack` (the name column content area). So the box is up to **32% wider** than that stack; the **smallest** of the three `min()` arguments wins.

  - **`54vw`** and **`42rem`** cap width on large screens so the video does not dominate the entire viewport.

  If the change looks **subtle**, it is often because **`min(...)` picks the cap** (e.g. `42rem` or `54vw`) or because **132%** of a narrow stack is only a modest pixel increase. To make a **bold** difference, increase **`132%`** (e.g. `140%`) or **`54vw`** / **`42rem`** deliberately, or inspect computed width in DevTools.

### Mobile (`max-width: 639px`)

`.home-hero-featured-player` resets to **full width** of the stack (with a max width). The hero stacks photo then name panel; the same tokens do not apply the wide breakout.

## Why “it didn’t look lower or bigger” (sanity checks)

1. **Lower** — Depends only on **`--hero-featured-after-roles-gap`** between intro and player. If the **hero min-height** (`.home-hero-split` / `--hero-split-min-height`) is tall, **flex alignment** (`justify-content: flex-start` on the name panel) may leave a lot of empty space **below** the player; the player might not move relative to the **viewport bottom** even when the gap between roles and player grew. Compare **roles → player** spacing in a screenshot before/after, not only page bottom whitespace.

2. **Bigger** — Width is **`min(132%, 54vw, 42rem)`**. On many viewports the ** limiting factor is `42rem` or `54vw`**, so increasing only `132%` may **not** change computed width until another constraint is loosened. Measure **computed width** on `.home-hero-featured-player` in DevTools.

3. **No featured row** — If `getFeaturedHomeVideo()` returns `null`, there is no player; `data-hero-featured-video="false"`.

## Quick verify

- **DB:** Featured row must be `published`; see `lib/featured-home-video.ts` for slug/title fallbacks.
- **DOM:** On `/`, `section.home-hero-section[data-hero-featured-video="true"]` and a child `.home-hero-featured-player`.
- **After token edits:** `npm run build` (project rule); refresh hard if CSS looks cached.

## Related doc

- Nav + hero band height / `--site-header-height`: `docs/handover-hero-nav-layout.md`
