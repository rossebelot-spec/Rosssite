/**
 * Reading shell for essays — Lora + Inter are loaded on <html> in root layout.
 * Visual tokens: .reading-theme, .journal-folio-paper (see globals.css).
 */
import { ReadingPieceShell } from "@/components/reading-piece-shell";

export default function EssaySlugLayout({ children }: { children: React.ReactNode }) {
  return <ReadingPieceShell>{children}</ReadingPieceShell>;
}
