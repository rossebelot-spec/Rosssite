import Image from "next/image";
import { blobImageUrl } from "@/lib/blob";

interface HeroProps {
  portraitUrl: string;
}

export function Hero({ portraitUrl }: HeroProps) {
  const hasPortrait = Boolean(portraitUrl);
  return (
    <section
      className="home-hero-section bg-background"
      data-hero-portrait={hasPortrait ? "true" : "false"}
    >
      <div className="home-hero-image-frame" aria-hidden>
        <div className="home-hero-image-inner">
          {portraitUrl ? (
            <Image
              src={blobImageUrl(portraitUrl)}
              alt=""
              fill
              priority
              sizes="(max-width: 80rem) 100vw, 80rem"
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
        </div>
      </div>

      <div className="hero-text-block">
        {/* Title color: globals.css [data-hero-portrait]… — avoid Tailwind text-* on h1 (utilities win over components). */}
        <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-wide leading-none text-balance">
          Ross Belot
        </h1>
      </div>
    </section>
  );
}
