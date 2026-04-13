import { ReadingPieceShell } from "@/components/reading-piece-shell";

export default function BookReviewSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReadingPieceShell>{children}</ReadingPieceShell>;
}
