/**
 * Folio paper + reading-theme wrapper for long-form / DB content
 * (essays, book reviews pattern, about, etc.). Tokens live in app/globals.css.
 */
export function ReadingPieceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="reading-theme essay-reading-shell">
      <div className="journal-folio-paper essay-reading-paper">{children}</div>
    </div>
  );
}
