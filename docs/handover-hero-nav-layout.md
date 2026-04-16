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
- **Approach:** A **callback ref** on the `<header>` (`setHeaderRef`) runs when the header mounts. It creates or reuses **`<style id="site-header-height-live">`** in `<head>` and sets:

  `:root { --site-header-height: <header.offsetHeight>px; }`

  A **`ResizeObserver`** on that same header element keeps the rule updated (fonts, resize, `contextLine`, mobile sheet). React does not own the `<style>` node; it persists across renders.
- **Why a callback ref:** An earlier `useLayoutEffect` + ref could run **after** first paint with a **null** ref, so the live rule never appeared until something else re-ran the effect. The callback ref attaches the observer **as soon as the DOM node exists**, before paint depending on timing — eliminating that race.

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

## Refresh “pop” — root cause & mitigations (Playwright)

**Symptom:** After a full reload, layout can briefly jump — **CLS** from `--site-header-height` staying at the **`globals.css` fallback** until `#site-header-height-live` exists with the measured height.

**What shipped:**

1. **`components/nav.tsx`** — Callback ref + **`ResizeObserver`** on `<header>` creates/updates **`#site-header-height-live`** as soon as the header node is attached (no separate bootstrap script).
2. **`app/globals.css`** — `:root` fallback **`4.3125rem`** (~69px) so any gap before the live rule runs matches a typical one-row nav more closely than the older `4.5rem` default.

**Note:** An earlier experiment inlined a bootstrap script from **`components/site-shell.tsx`**; that file is now a thin shell (`Nav` + children + `Footer`) only. If you see docs elsewhere referencing `lib/site-header-height-bootstrap.ts`, they are obsolete — the implementation lives entirely in **`nav.tsx`**.

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
| Hero CSS    | `app/globals.css` (`.home-hero-section`, `.home-hero-split`, `.home-hero-image-zoom`, `.hero-text-stack`, `.hero-text-name-*`, roles line; tokens `--hero-*`) |
| Nav         | `components/nav.tsx` (`setHeaderRef` + `#site-header-height-live`) |
| Shell       | `components/site-shell.tsx` |
| Root layout | `app/layout.tsx` (`data-scroll-behavior="smooth"` on `<html>`) |

## Project constraints (do not ignore)

- Read `AGENTS.md` / `.cursorrules` — Next 16, no `db.transaction()` with HTTP driver, no push/deploy unless asked, **`npm run build`** before considering layout work done.
- Do not add npm packages without asking.

## Summary for the new agent

The **core bug** was **CSS variable resolution on `:root`** plus **fragile inline styles on `html`/`body`**. The **fix** is **section-level hero clamp** + **injected `<style>`** for `:root { --site-header-height: … }`. The **refresh “pop”** is **CLS** until the live rule exists; the **callback ref** attaches measurement as soon as the `<header>` mounts, and the **tighter rem fallback** shrinks the worst-case gap.
