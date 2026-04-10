# TipTap Editor — Admin Toolbar Reference

Rich text editor used in `/admin/essays/*` and `/admin/book-reviews/*`.
Built on TipTap v3 / ProseMirror with custom extensions for block-level formatting.

---

## Toolbar Controls

### Text Formatting

| Button | What it does |
|--------|-------------|
| **Bold** | Toggle bold on selected text |
| **Italic** | Toggle italic |
| **Underline** | Toggle underline |
| **Strike** | Toggle strikethrough |

### Font

Dropdown that sets font-family on the selected text via the `textStyle` mark.
Choosing "Default" removes the inline font override so the CSS theme font applies.

Options: Default, Cormorant, Lora, Inter, JetBrains Mono, Georgia, Times New Roman.

### Size

Dropdown that sets font-size on the selected text.
Choosing "Default" removes the inline size so the CSS theme size applies.

Options: Default, 12px, 14px, 16px, 18px, 20px, 24px.

### Spacing (Line Height)

Dropdown that sets `line-height` **on the current block** (paragraph, heading, or blockquote).
This is a block-level attribute — it controls the space between lines *within* that block.

Choosing "Default" removes the inline override so the CSS value (`--essay-body-line-height`) applies.

Options: Default, 1.15, 1.2, 1.35, 1.5, 1.65, 1.75, 2.

### After ¶ (Paragraph Spacing)

Dropdown that sets `margin-bottom` **on the current block**.
This controls the gap *between* the current block and the next one.

- **0** (default) — no extra space after the paragraph; the next paragraph sits flush.
- Any other value adds that much space below the block.

Choosing "0" removes the inline margin so the CSS default (`--essay-paragraph-flow: 0`) applies.

Options: 0, 0.25em, 0.5em, 0.75em, 1em, 1.25em, 1.5em, 2em.

### Color

Color picker + **Default** button for text color.
The picker sets an inline `color` style on selected text.
**Default** removes it so the CSS theme color applies.

### Block Type

| Button | What it does |
|--------|-------------|
| **H2** | Toggle heading level 2 |
| **H3** | Toggle heading level 3 |

### Text Alignment

| Icon | Alignment |
|------|-----------|
| Left-align icon | Align left (default) |
| Center icon | Center |
| Right-align icon | Align right |
| Justify icon | Justify |

Alignment is a block-level attribute on paragraphs, headings, and blockquotes.

### Lists & Blocks

| Button | What it does |
|--------|-------------|
| **List** | Toggle bullet list |
| **Ordered** | Toggle numbered list |
| **Quote** | Toggle blockquote |
| **HR** | Insert horizontal rule |

### History

| Button | What it does |
|--------|-------------|
| **Undo** | Undo last change |
| **Redo** | Redo last undone change |

---

## Clean Format

**What it does:** Strips Word/Google Docs paste artifacts from the **entire document** so that CSS theme rules control rendering and the toolbar stays truthful.

**Why it exists:** When you paste from Word or Google Docs, the HTML carries hidden inline styles — `font-family`, `font-size`, `line-height`, Word-specific `mso-*` properties, class names, `<style>` tags, and `<o:p>` elements. These inline styles silently override the CSS theme, so the toolbar may say "Default" for font or "1.2" for line spacing while the text actually renders with Word's original values. Clean Format removes this mismatch.

**Specifically, it:**

1. Removes `<style>`, `<meta>`, `<link>`, `<title>`, `<xml>`, and `<o:p>` elements.
2. Walks every element with a `style` attribute and strips all inline styles **except**:
   - `color` (unless it's a default black — `#000`, `rgb(0,0,0)`, `windowtext`)
   - `background-color`
   - `text-align`
   - `text-decoration`
3. Removes all `class` attributes.
4. Unwraps empty `<span>` elements (spans with no remaining attributes are replaced by their text content).

**What it preserves:** Explicit text color, background color, text alignment, and text decoration (underline/strikethrough). Bold, italic, headings, lists, blockquotes, images, and document structure are unaffected.

**When to use it:**
- After pasting content from Word, Google Docs, or any rich-text source.
- When the toolbar says one thing but the editor renders another (e.g., toolbar says "Default" font but text renders in Calibri).
- As a one-time cleanup on legacy essays that were originally pasted from Word.

**Irreversible:** Clean Format replaces the document content. Use Undo immediately if the result isn't what you expected. Once you save, the cleanup is permanent.

---

## Automatic Paste Cleanup

The same cleanup logic runs automatically whenever you paste into the editor (`transformPastedHTML`). You should not need Clean Format for *new* pastes — it's mainly for cleaning up content that was pasted before this feature existed.

---

## Initialization Guard

The editor uses a `readyRef` gate to prevent false saves during startup. When the editor loads or receives new content:

1. `readyRef` is set to `false`, blocking the `onUpdate` handler from calling `onChange`.
2. Content is injected with `emitUpdate: false`.
3. After all synchronous extension processing (e.g., TextAlign's `appendTransaction`) completes, a `setTimeout(0)` re-enables saves.

This prevents the TextAlign extension's initialization-time node modifications from being saved back to the database as if the user had made an edit.

---

## Custom Extensions

### BlockLineHeight

Applies `line-height` as a **node attribute** on block elements (paragraph, heading, blockquote), rendered as an inline `style="line-height: ..."` on the `<p>`/`<h2>`/etc. tag.

This replaces TipTap's default LineHeight extension (which applied line-height to inline `<span>` elements via the `textStyle` mark — a design that cannot override block-level CSS line-height).

Commands: `setLineHeight(value)`, `unsetLineHeight()`.

### BlockSpacing

Applies `margin-bottom` as a **node attribute** on block elements, rendered as an inline `style="margin-bottom: ..."`.

Commands: `setSpacingAfter(value)`, `unsetSpacingAfter()`.

---

## CSS Integration

The editor's formatting controls interact with CSS custom properties defined in `app/globals.css`:

| CSS Variable | Default | Controls |
|-------------|---------|----------|
| `--essay-body-line-height` | `1.2` | Base line spacing for essay body text |
| `--essay-paragraph-flow` | `0` | Base margin-top between paragraphs |
| `--essay-body-font-size` | `1.125rem` | Base font size |
| `--essay-reading-font-family` | Lora | Base reading font |

When a toolbar dropdown is set to "Default" or "0", the inline style is removed and the CSS variable controls rendering. When set to a specific value, the inline style overrides the CSS.
