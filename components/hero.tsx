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
      <div className="home-hero-split">
        <div className="home-hero-photo-col" aria-hidden>
          <div className="home-hero-image-inner">
            {portraitUrl ? (
              <>
                <div className="home-hero-image-zoom">
                  <Image
                    src={blobImageUrl(portraitUrl)}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, 67vw"
                    className="home-hero-image-img object-cover"
                  />
                </div>
                <div className="home-hero-photo-mask-right" aria-hidden />
              </>
            ) : (
              <div className="home-hero-image-placeholder" />
            )}
          </div>
        </div>

        <div className="home-hero-name-panel">
          <div className="hero-text-stack">
            <h1 className="hero-text-name">
              <span className="hero-text-name-given">Ross</span>
              <span className="hero-text-name-family">Belot</span>
            </h1>
            <p className="hero-text-roles">
              Poet · Essayist · Filmmaker · Translator
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
