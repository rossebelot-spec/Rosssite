"use client";

import { cn } from "@/lib/utils";
import styles from "./gallery-shake-it-button.module.css";

export interface GalleryShakeItButtonProps {
  onClick: () => void;
  /** Layout from parent (e.g. flex alignment); position stays with gallery header row. */
  className?: string;
}

/**
 * Mosaic refresh control: flat print red, transform-only motion — no shadow/gradient.
 */
export function GalleryShakeItButton({
  onClick,
  className,
}: GalleryShakeItButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        styles.shakeIt,
        "inline-flex cursor-pointer select-none items-center justify-center",
        "border-0 px-6 py-2.5",
        "rounded-md",
        "text-xs font-medium uppercase tracking-[0.18em]",
        "will-change-transform",
        className
      )}
    >
      SHAKE IT
    </button>
  );
}
