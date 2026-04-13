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
