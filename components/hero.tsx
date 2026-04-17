import Image from "next/image";
import { blobImageUrl } from "@/lib/blob";
import { HomeFeaturedVideoPlayer } from "@/components/home-featured-video-player";

/** Props for the optional featured clip rendered in the hero name column (player only). */
export type HeroFeaturedVideo = {
  title: string;
  slug: string;
  r2Url: string | null;
  thumbnailUrl?: string | null;
};

interface HeroProps {
  portraitUrl: string;
  featuredVideo?: HeroFeaturedVideo | null;
}

export function Hero({ portraitUrl, featuredVideo = null }: HeroProps) {
  const hasPortrait = Boolean(portraitUrl);
  const showFeatured = Boolean(featuredVideo);

  return (
    <section
      className="home-hero-section bg-background"
      data-hero-portrait={hasPortrait ? "true" : "false"}
      data-hero-featured-video={showFeatured ? "true" : "false"}
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
            <div className="hero-text-intro">
              <h1 className="hero-text-name">
                <span className="hero-text-name-given">Ross</span>
                <span className="hero-text-name-family">Belot</span>
              </h1>
              <p className="hero-text-roles">
                Poet · Essayist · Filmmaker · Photographer · Translator
              </p>
            </div>
            {featuredVideo ? (
              <HomeFeaturedVideoPlayer
                title={featuredVideo.title}
                r2Url={featuredVideo.r2Url}
                thumbnailUrl={featuredVideo.thumbnailUrl}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
