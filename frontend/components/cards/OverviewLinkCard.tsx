"use client";

import Image from "next/image";
import Link from "next/link";
import { MdArrowForwardIos } from "react-icons/md";
import { Text } from "../atoms/typography/Text";

type OverviewLinkItem = {
  imageSrc: string;
  imageAlt: string;
  text: string;
  href: string;
};

type Props = {
  item: OverviewLinkItem;
  className?: string;
  imageClassName?: string;
  locale?: string;
};

export default function OverviewLinkCard({
  item,
  className,
  imageClassName,
  locale,
}: Props) {
  const { imageSrc, imageAlt, text, href } = item;

  return (
    <Link
      href={`/${locale}${href}`}
      className={`group block w-full  ${className ?? ""}`}
    >
      <div className="flex h-38.75 w-full flex-col bg-white shadow-[0px_4px_15px_rgba(0,0,0,0.1)] transition-transform duration-200  md:h-[86px] md:flex-row md:items-center md:gap-8 md:pr-5 hover:bg-brand-charcoal">
        <div className="relative h-30 w-full shrink-0 md:h-21.5 md:w-30">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="200"
            className={`object-cover w-41.25 h-29.5 md:w-30.25 md:h-21.5 ${
              imageClassName ?? ""
            }`}
          />
        </div>
        <div className="flex w-full items-center align-middle px-4 py-0 md:px-0 md:py-0 ">
          <Text
            text={text}
            className="text-ink text-[16px] md:text-[18px] lg:text-[18px] font-bold tracking-[0.05em] leading-[1.7] group-hover:text-white"
          />
          <span className="ml-auto hidden md:block text-ink group-hover:text-white">
            <MdArrowForwardIos color="#2BB673" size={24} />
          </span>
        </div>
      </div>
    </Link>
  );
}
