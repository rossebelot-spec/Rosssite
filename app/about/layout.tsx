/**
 * Same reading shell as /essays/[slug] — folio paper + .reading-theme tokens (globals.css).
 */
import { ReadingPieceShell } from "@/components/reading-piece-shell";

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <ReadingPieceShell>{children}</ReadingPieceShell>;
}
