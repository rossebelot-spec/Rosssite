"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import type { GalleryPhoto } from "@/db/schema";
import { Button } from "@/components/ui/button";

interface GalleryLightboxProps {
  photo: GalleryPhoto;
  onClose: () => void;
}

export function GalleryLightbox({ photo, onClose }: GalleryLightboxProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = photo.title?.trim() || "";

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-lightbox-title"
    >
      <div
        className="absolute inset-0 bg-background/90"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 flex max-h-[92dvh] w-full max-w-5xl flex-col gap-3 rounded-md border border-border bg-surface p-3 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="relative mx-auto w-full max-w-[min(100%,56rem)]">
          <Image
            src={photo.r2Url}
            alt={title || "Photograph"}
            width={photo.width ?? 1600}
            height={photo.height ?? 1066}
            className="mx-auto h-auto max-h-[min(78dvh,880px)] w-auto max-w-full object-contain"
            sizes="(max-width: 1280px) 100vw, 1024px"
            priority
          />
        </div>
        {title ? (
          <p
            id="gallery-lightbox-title"
            className="shrink-0 text-center font-heading text-lg text-foreground"
          >
            {title}
          </p>
        ) : (
          <span id="gallery-lightbox-title" className="sr-only">
            Photograph
          </span>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
