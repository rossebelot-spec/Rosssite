/**
 * Reading shell for essays — Lora + Inter are loaded on <html> in root layout.
 * Visual tokens: .reading-theme, .journal-folio-paper (see globals.css).
 */
export default function EssaySlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="reading-theme essay-reading-shell">
      <div className="journal-folio-paper essay-reading-paper">{children}</div>
    </div>
  );
}
