"use client";
import Image from "next/image";
import type { CSSProperties } from "react";

type SliderImage = {
  src: string;
  alt: string;
};

type Props = {
  images: SliderImage[];
  slideWidth: number;
  slideHeight: number;
  className?: string;
};

export default function MarqueeSlider({
  images,
  slideWidth,
  slideHeight,
  className = "",
}: Props) {
  const loopedImages = [...images, ...images];
  const sliderStyle = {
    "--slide-width": `${slideWidth}px`,
    "--slide-height": `${slideHeight}px`,
    "--slide-count": images.length,
  } as CSSProperties;

  return (
    <div
      className={`relative w-full -translate-y-4 lg:mt-20 overflow-hidden ${className}`.trim()}
    >
      <div className="slider" style={sliderStyle}>
        <div className="slide-track">
          {loopedImages.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="slide relative overflow-hidden bg-transparent shadow rounded-none"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes={`${slideWidth}px`}
                loading={index < images.length ? "eager" : "lazy"}
                priority={index < images.length}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
