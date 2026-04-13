import Image from "next/image";
import { blobImageUrl } from "@/lib/blob";

interface HeroProps {
  portraitUrl: string;
}

export function Hero({ portraitUrl }: HeroProps) {
  const hasPortrait = Boolean(portraitUrl);
  return (
    <section
      className="home-hero-section bg-surface"
      data-hero-portrait={hasPortrait ? "true" : "false"}
    >
      <div className="pointer-events-none absolute inset-0">
        {portraitUrl ? (
          <Image
            src={blobImageUrl(portraitUrl)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-surface" />
        )}
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
