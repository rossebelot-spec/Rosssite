import { opEdMastheadImgSrc } from "@/lib/op-ed-masthead";

type OpEdMastheadImgProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Masthead logos are often SVGs under /public/mastheads. next/image is unreliable for SVGs
 * and local paths; a plain img avoids optimizer issues.
 */
export function OpEdMastheadImg({
  src,
  alt,
  width,
  height,
  className,
}: OpEdMastheadImgProps) {
  const resolved = opEdMastheadImgSrc(src);
  if (!resolved) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVGs / local paths; see module comment
    <img
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={className}
      decoding="async"
      loading="lazy"
    />
  );
}
