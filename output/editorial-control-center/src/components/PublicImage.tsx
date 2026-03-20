import Image, { type ImageProps } from "next/image";

export type PublicImageMedia = {
  alt?: string | null;
  alt_text?: string | null;
  height?: number | null;
  url?: string | null;
  width?: number | null;
};

export type PublicImageProps = Omit<ImageProps, "alt" | "height" | "src" | "width"> & {
  alt?: string;
  fallbackAlt?: string;
  height?: number;
  media?: PublicImageMedia | null;
  src?: ImageProps["src"];
  width?: number;
};

export function PublicImage({
  alt,
  fallbackAlt,
  height,
  media,
  src,
  width,
  ...props
}: PublicImageProps) {
  const resolvedSrc = src ?? media?.url;

  if (!resolvedSrc) {
    return null;
  }

  const resolvedAlt = alt ?? media?.alt_text ?? media?.alt ?? fallbackAlt ?? "";

  if (props.fill) {
    return <Image {...props} alt={resolvedAlt} src={resolvedSrc} />;
  }

  const resolvedWidth = width ?? media?.width ?? undefined;
  const resolvedHeight = height ?? media?.height ?? undefined;

  if (resolvedWidth == null || resolvedHeight == null) {
    throw new Error("PublicImage requires width and height unless fill is enabled.");
  }

  return (
    <Image
      {...props}
      alt={resolvedAlt}
      height={resolvedHeight}
      src={resolvedSrc}
      width={resolvedWidth}
    />
  );
}
