# Handover: Home hero layout & `--site-header-height`

## Goal

Fix the homepage hero so a **tall sticky nav** does not stack an extra **fixed `72vh`-style band** on top of the header, which pushed the three-column `<main>` block down and looked broken. The fix should stay coherent when the nav height changes (tagline, two rows, `contextLine`, etc.).

## What shipped (commit `d3179f2` area — verify with `git log` / `git show`)

### 1. Hero min-height ( `app/globals.css` )

- **Do not** define hero band height on `:root` using `var(--site-header-height)` for the **same** token chain: on `:root`, `var(--site-header-height)` resolves against **`<html>`’s** declared value (`4.5rem` from CSS), not Nav’s live measurement.
- **Do** set min-height on **`.home-hero-section`** only:

  `min-height: clamp(20rem, calc(100svh - var(--site-header-height)), 42rem);`

  so inheritance/cascade can see the measured header height once `:root` is updated.

### 2. Nav measurement ( `components/nav.tsx` )

- **Problem:** Setting `document.documentElement.style` or `document.body.style` for `--site-header-height` is unreliable — **React can reset** those nodes on hydrate/update.
- **Approach:** `useLayoutEffect` + **`ResizeObserver`** on the `<header>`, writing a **`<style id="site-header-height-live">`** in `<head>`:

  `:root { --site-header-height: <N>px; }`

  React does not own that node; it persists across renders.
- **Ref fallback:** `headerRef.current ?? document.querySelector("body > header")` — in some passes the ref was still null; without a fallback the effect could bail and never re-run until `contextLine` changed.

### 3. Playwright smoke script ( `scripts/debug-hero-dom.mjs` )

- Uses `waitUntil: "load"` (not `networkidle` — dev HMR can prevent idle).
- Waits for `#site-header-height-live` to exist and contain `px`.
- Two viewports; asserts hero below header, main below hero, hero title not overlapping `<main>`.
- Exit code `1` on failure. Tip printed if the wait times out (often **stale dev bundle** — restart `npm run dev`).

## How to verify

```bash
npm run build
PORT=3002 npx next start   # or any free port
node scripts/debug-hero-dom.mjs http://127.0.0.1:3002
```

After **Nav** changes, if testing against `npm run dev`, **restart the dev server** so the client bundle matches disk.

## Refresh “pop” — root cause & fix (Playwright)

**Symptom:** After a full reload, layout briefly jumped — **CLS** from `--site-header-height` staying at the **`globals.css` fallback** until React’s `Nav` injected `#site-header-height-live` after hydration.

**Fix shipped (inline bootstrap + tighter fallback):**

1. **`lib/site-header-height-bootstrap.ts`** — minified IIFE inlined in **`components/site-shell.tsx`** immediately after `<Nav />`. It creates/updates `#site-header-height-live` with `:root { --site-header-height: <header.offsetHeight>px }` **as soon as the parser reaches the script** (before React hydrates).
2. **`components/nav.tsx`** — unchanged behaviour: same `id`, `ResizeObserver` keeps the value correct when the header height changes (fonts, resize, `contextLine`).
3. **`app/globals.css`** — `:root` fallback changed from **`4.5rem` → `4.3125rem`** (~69px) so any sub-millisecond gap before the script runs is smaller.

**Verification:** On `next start`, `scripts/debug-hero-refresh-timeline.mjs` now shows **`liveExists: true`** and **`rootVar: 69px`** already at **`readystate-interactive`** / **`load`** (no longer `4.5rem` through `load`).

**Run the probe:**

```bash
npm run build && PORT=3010 npx next start   # any free port
node scripts/debug-hero-refresh-timeline.mjs http://127.0.0.1:3010
```

## Related files (quick map)

| Area        | Path |
|------------|------|
| Hero markup | `components/hero.tsx` |
| Home page   | `app/page.tsx` |
| Hero CSS    | `app/globals.css` (`.home-hero-section`, `.hero-text-block`, `.home-hero-image-frame`, nav font tokens) |
| Nav         | `components/nav.tsx` |
| Shell       | `components/site-shell.tsx` (inline header-height bootstrap) |
| Bootstrap   | `lib/site-header-height-bootstrap.ts` |
| Root layout | `app/layout.tsx` |

## Project constraints (do not ignore)

- Read `AGENTS.md` / `.cursorrules` — Next 16, no `db.transaction()` with HTTP driver, no push/deploy unless asked, **`npm run build`** before considering layout work done.
- Do not add npm packages without asking.

## Summary for the new agent

The **core bug** was **CSS variable resolution on `:root`** plus **fragile inline styles on `html`/`body`**. The **fix** is **section-level hero clamp** + **injected `<style>`** for `:root --site-header-height`. The **refresh “pop”** was **CLS** until the live rule existed; **bootstrap + tighter rem fallback** applies the measured height before hydration.
