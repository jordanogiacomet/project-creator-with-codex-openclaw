import Image, { type ImageProps } from "next/image";

export type PublicImageProps = ImageProps;

export default function PublicImage({
  alt,
  fill,
  quality = 85,
  sizes,
  ...props
}: PublicImageProps) {
  return (
    <Image
      {...props}
      alt={alt}
      fill={fill}
      quality={quality}
      sizes={sizes ?? (fill ? "100vw" : undefined)}
    />
  );
}
