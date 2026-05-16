"use client";

import { getLocaleFontClasses } from "@/app/fonts";
import Image from "next/image";
import Link from "next/link";
import { Text } from "../atoms/typography/Text";

type Card = {
  imageSrc: string;
  imageAlt: string;
  tagText: string;
  title: string;
  description: string;
  href: string;
  ctaText: string;
  className?: string;
};

type Props = {
  card: Card;
  locale: string;
};

export default function ServiceCard({
  card: {
    imageSrc,
    imageAlt,
    href,
    tagText,
    title,
    description,
    ctaText,
    className,
  },
  locale,
}: Props) {
  const { robotoOrZen } = getLocaleFontClasses(locale);

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`block h-full w-full  ${className ?? ""} overflow-hidden`}
    >
      <div className="flex h-full w-full flex-col border rounded-lg border-brand-stone bg-white transition-transform duration-200 hover:-translate-y-0.5">
        <Image
          src={imageSrc}
          alt={imageAlt}
          height={200}
          width={200}
          className="object-cover min-h-45 max-h-45 w-full rounded-t-lg"
        />

        <div className="flex flex-1 self-stretch flex-col px-4 lg:px-6 pt-4 pb-6 relative">
          <pre
            className={`block text-[12px] lg:text-[14px] pb-2 font-black leading-[1.7] text-ink ${robotoOrZen} ${
              locale == "en"
                ? "whitespace-normal h-fit md:h-18"
                : "md:h-14 h-fit"
            }`}
          >
            {tagText}
          </pre>

          <pre
            className={`block text-[16px] md:text-[20px] lg:text-[24px] whitespace-normal  font-bold leading-[1.7] tracking-[0.05em] text-primary ${robotoOrZen} ${
              locale == "en" ? "h-fit md:h-16" : ""
            }`}
          >
            {title}
          </pre>
          <pre
            className={`block whitespace-pre-line text-[14px] leading-[1.7] tracking-[0.04em] text-ink/80 pt-4 md:pt-5 ${robotoOrZen} ${
              locale == "en" ? "whitespace-normal" : ""
            }`}
          >
            {description}
          </pre>

          <div className="pt-5 flex justify-end items-baseline pb-5">
            <Text
              text={ctaText}
              className="text-[13px] md:text-[14px] absolute bottom-5 font-black leading-[1.3] text-brand-green-dark"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
