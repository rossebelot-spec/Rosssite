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

## Open issue (user report — **not** fixed in this handover)

**Symptom:** Layout looked correct until a **full page refresh**, then something **“popped up to the top”** again (scroll position and/or hero/header stacking — confirm with user or a screen recording).

**Hypotheses for the next agent (investigate in order):**

1. **Scroll restoration / `scrollY`:** Browsers restore scroll on refresh; with a **dynamic hero height** (CSS updates after `#site-header-height-live` runs), the **document height** can change between first paint and after measurement — restored scroll can land in a **wrong** visual position (e.g. content “jumps”).
2. **First paint vs measured header:** Until `#site-header-height-live` runs, `:root --site-header-height` may still be **4.5rem** from `globals.css`. A **layout shift** on hydrate can feel like things “pop” (CLS). Refresh repeats full navigation so this is more visible than client-side transitions.
3. **`100svh` / mobile URL bar:** `svh`/`dvh` behaviour differs across loads; less likely on desktop but worth noting if repro is mobile.
4. **Next.js / React 19:** Any **streaming** or **partial hydration** ordering could theoretically delay the style tag — compare **hard refresh** vs **client navigation** from another route.

**Suggested next steps:**

- Reproduce with **Performance** + **Layout shift** regions, or a tiny Playwright script: log `scrollY`, `document.documentElement.style` / `#site-header-height-live`, and hero/main `getBoundingClientRect()` at `load`, `+100ms`, `+500ms`, and after `requestAnimationFrame` ×2.
- If CLS is confirmed: consider **reserving** initial space (e.g. `min-height` on header in CSS close to real height) or applying the measured height **earlier** without fighting React (e.g. only `next/script` strategy if approved — **ask before adding dependencies** per project rules).
- If scroll restore is the issue: `history.scrollRestoration = 'manual'` and controlled scroll-to-top on `/` only — **URL/bookmark impact** — **ask user** before changing scroll behaviour.

## Related files (quick map)

| Area        | Path |
|------------|------|
| Hero markup | `components/hero.tsx` |
| Home page   | `app/page.tsx` |
| Hero CSS    | `app/globals.css` (`.home-hero-section`, `.hero-text-block`) |
| Nav         | `components/nav.tsx` |
| Shell       | `components/site-shell.tsx` |
| Root layout | `app/layout.tsx` |

## Project constraints (do not ignore)

- Read `AGENTS.md` / `.cursorrules` — Next 16, no `db.transaction()` with HTTP driver, no push/deploy unless asked, **`npm run build`** before considering layout work done.
- Do not add npm packages without asking.

## Summary for the new agent

The **core bug** was **CSS variable resolution on `:root`** plus **fragile inline styles on `html`/`body`**. The **fix** is **section-level hero clamp** + **injected `<style>`** for `:root --site-header-height`. The **refresh “pop”** is a **separate**, likely **timing/scroll/CLS** issue — reproduce first, then fix narrowly without stacking unrelated workarounds.
