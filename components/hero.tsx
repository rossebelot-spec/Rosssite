import Image from "next/image";
import { blobImageUrl } from "@/lib/blob";

interface HeroProps {
  portraitUrl: string;
}

export function Hero({ portraitUrl }: HeroProps) {
  return (
    <section className="fixed inset-0 z-0 overflow-hidden">
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

      <div className="hero-bottom-gradient" aria-hidden="true" />

      <div className="hero-text-block">
        <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground tracking-wide leading-none text-balance">
          Ross Belot
        </h1>
        <p className="hero-text-tagline font-sans text-xs tracking-widest uppercase mt-3">
          Poet &middot; Journalist &middot; Environmental Writer
        </p>
      </div>
    </section>
  );
}
