"use client";

import { Link } from "@/navigation";
import Image from "next/image";

export type PostRailItemType = "news" | "recruit";

export type PostRailItem = {
  id: string | number;
  type: PostRailItemType;
  href: string;
  title: string;
  date?: string | null;
  excerpt?: string | null;
  category?: { name?: string | null; slug?: string | null } | null;
  featuredImage?: { url: string; alt?: string | null } | null;
};

type Props = {
  title: string;
  items: PostRailItem[];
  className?: string;
  showTitle?: boolean;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

const FALLBACK_THUMBNAIL =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#F0F7F7"/>
          <stop offset="1" stop-color="#E4E3DF"/>
        </linearGradient>
      </defs>
      <rect width="480" height="320" rx="28" fill="url(#g)"/>
      <rect x="52" y="68" width="376" height="184" rx="18" fill="#F4F4F2" stroke="#E4E3DF"/>
      <path d="M96 208l72-68 52 48 72-64 88 80H96z" fill="#E4E3DF"/>
      <circle cx="184" cy="132" r="18" fill="#E4E3DF"/>
    </svg>`
  );

const MOBILE_VISIBLE_COUNT = 4;

export default function PostRail({
  title,
  items,
  className,
  showTitle = true,
}: Props) {
  const safeItems = Array.isArray(items) ? items : [];

  if (safeItems.length === 0) return null;

  const visibleItems = safeItems.slice(0, MOBILE_VISIBLE_COUNT);

  const renderRailCard = (item: PostRailItem) => {
    const dateLabel = formatDate(item.date);
    const categoryLabel = item.category?.name ?? "";
    const imageUrl = item.featuredImage?.url || FALLBACK_THUMBNAIL;
    const imageAlt = item.featuredImage?.alt || item.title;

    return (
      <article
        key={`${item.type}:${item.id}`}
        data-rail-card
        className="w-[278px] shrink-0 max-[767px]:w-full"
      >
        <Link
          href={item.href}
          className="group flex w-[278px] flex-col max-[767px]:w-full"
        >
          <div className="relative h-[180px] w-[278px] overflow-hidden rounded-[8px] bg-[#F4F4F2] max-[767px]:h-[200px] max-[767px]:w-full">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 767px) 343px, 278px"
            />
          </div>

          <div className="mt-[16px] flex min-h-0 flex-1 flex-col">
            <div className="overflow-hidden font-['Zen_Kaku_Gothic_Antique'] text-[16px] font-bold leading-[1.7] tracking-[0.8px] text-[#252422] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {item.title}
            </div>
            <div className="mt-[8px] flex w-full items-center justify-between gap-[16px] max-[767px]:w-full max-[767px]:justify-between">
              {dateLabel ? (
                <span className="font-noto-jp text-[16px] font-normal leading-[1.6] tracking-[0.8px] text-[#252422] max-[767px]:text-[14px] max-[767px]:tracking-[0.7px]">
                  {dateLabel}
                </span>
              ) : (
                <span />
              )}
              {categoryLabel ? (
                <span className="inline-flex w-[129px] shrink-0 items-center justify-center rounded-[4px] bg-[#2BB673] px-[12px] py-[4px] font-noto-jp text-[14px] font-normal leading-[1.6] tracking-[0.7px] text-white max-[767px]:ml-auto max-[767px]:w-auto max-[767px]:text-[12px] max-[767px]:tracking-[0.6px]">
                  {categoryLabel}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      </article>
    );
  };

  return (
    <section className={className ? className : ""} aria-label={title}>
      {showTitle ? (
        <h3 className="text-[16px] md:text-[18px] font-black tracking-[0.06em] text-ink">
          {title}
        </h3>
      ) : null}

      <div
        className={[
          showTitle ? "mt-4" : "mt-0",
          "flex w-full flex-wrap gap-[24px] max-[767px]:flex-col",
        ].join(" ")}
      >
        {visibleItems.map((item) => renderRailCard(item))}
      </div>
    </section>
  );
}
