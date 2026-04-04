import Image from "next/image";
import { blobImageUrl } from "@/lib/blob";

interface HeroProps {
  portraitUrl: string;
}

export function Hero({ portraitUrl }: HeroProps) {
  return (
    <section className="h-screen flex flex-col md:flex-row overflow-hidden">

      {/* ── Left: Portrait ─────────────────────────────────────────────── */}
      <div className="relative w-full md:w-1/2 h-1/2 md:h-full overflow-hidden">
        {portraitUrl ? (
          <Image
            src={blobImageUrl(portraitUrl)}
            alt="Ross Belot"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-top"
          />
        ) : (
          // Placeholder until portrait URL is set
          <div className="w-full h-full bg-surface" />
        )}

        {/* Gradient: desktop — right edge fades into text panel */}
        <div className="hidden md:block absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-background" />

        {/* Gradient: mobile — bottom edge fades into text section */}
        <div className="md:hidden absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* ── Right: Text panel ──────────────────────────────────────────── */}
      <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-background flex flex-col justify-center px-10 md:px-16 lg:px-20">
        <div>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-wide leading-none text-foreground">
            Ross Belot
          </h1>

          <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mt-6">
            Poet &middot; Journalist &middot; Environmental Writer
          </p>

          <p className="font-sans text-sm text-muted-foreground mt-5 max-w-xs leading-relaxed">
            Writing at the intersection of ecology, industry, and the lyric.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-10 md:left-16 lg:left-20 flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
          <svg
            width="14"
            height="20"
            viewBox="0 0 14 20"
            fill="none"
            aria-hidden="true"
          >
            <line
              x1="7"
              y1="1"
              x2="7"
              y2="16"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M2 11l5 6 5-6"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

    </section>
  );
}
