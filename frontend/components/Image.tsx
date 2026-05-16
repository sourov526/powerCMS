import NextImage, { type StaticImageData } from "next/image";

type ImageProps = {
  src: StaticImageData | string;
  alt: string;
  height?: number;
  width?: number;
  className?: string;
};

export default function Image({
  src,
  alt,
  height,
  width,
  className,
}: ImageProps) {
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{
        ...(width ? { width } : null),
        ...(height ? { height } : null),
      }}
    >
      <NextImage src={src} alt={alt} fill className="object-cover" priority />
    </div>
  );
}
