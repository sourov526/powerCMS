"use client";

import { usePathname, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import NewsList from "./News_list";
import NewsPagination from "./NewsPagination";

type CategoryTab = {
  id: number;
  slug: string;
  name: string;
};

export type PostItem = {
  id: number;
  locale?: string;
  slug: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  publishedAt?: string | null;
  featuredImage?: string | null;
  featuredImageAlt?: string | null;
  category?: { slug?: string | null; name?: string | null } | null;
  categories?: { slug?: string | null; name?: string | null }[];
};

type Props = {
  posts: PostItem[];
  categories: CategoryTab[];
  initialActive?: string;
  labels: {
    all: string;
    empty: string;
  };
};

const ITEMS_PER_PAGE = 10;

function getPostYear(post: PostItem) {
  const value = post.publishedAt ?? post.updatedAt;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear();
}

export default function NewsCategoryTabs({
  posts,
  categories,
  labels,
  initialActive,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryScrollerRef = useRef<HTMLDivElement | null>(null);
  const yearScrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(
    initialActive || "all"
  );
  const [activeYear, setActiveYear] = useState<"all" | number>("all");
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const years = useMemo(() => {
    const unique = new Set<number>();
    posts.forEach((post) => {
      const year = getPostYear(post);
      if (year) unique.add(year);
    });
    return Array.from(unique).sort((a, b) => b - a);
  }, [posts]);

  useEffect(() => {
    setActiveCategory(initialActive || "all");
  }, [initialActive]);

  useEffect(() => {
    const value = searchParams?.get("year") ?? "";
    if (!value) {
      setActiveYear("all");
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setActiveYear("all");
      return;
    }
    setActiveYear(parsed);
  }, [searchParams]);

  const buildHrefWithYear = (
    nextPathname: string,
    nextYear: "all" | number
  ) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (nextYear === "all") params.delete("year");
    else params.set("year", String(nextYear));
    const query = params.toString();
    return query ? `${nextPathname}?${query}` : nextPathname;
  };

  const filtered = useMemo(() => {
    let result = posts;
    if (activeCategory !== "all") {
      result = result.filter((post) => {
        if (post.category?.slug === activeCategory) return true;
        const categories = Array.isArray(post.categories)
          ? post.categories
          : [];
        if (categories.some((category) => category.slug === activeCategory)) {
          return true;
        }
        return false;
      });
    }
    if (activeYear !== "all") {
      result = result.filter((post) => getPostYear(post) === activeYear);
    }
    return result;
  }, [activeCategory, activeYear, posts]);

  useEffect(() => {
    setPage(0);
  }, [activeCategory, activeYear]);

  useEffect(() => {
    const container = categoryScrollerRef.current;
    if (!container) return;
    const activeButton = container.querySelector<HTMLButtonElement>(
      'button[data-active="true"]'
    );
    activeButton?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeCategory, categories.length]);

  useEffect(() => {
    const container = yearScrollerRef.current;
    if (!container) return;
    const activeButton = container.querySelector<HTMLButtonElement>(
      'button[data-active="true"]'
    );
    activeButton?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeYear, years.length]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const handleChange = (event: MediaQueryListEvent) =>
      setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const shouldShowPagination = filtered.length > 10 && totalPages > 1;
  const pagedPosts = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(0);
    }
  }, [page, totalPages]);

  const getTabClassName = (active: boolean) =>
    [
      "inline-flex items-center justify-center gap-[10px] cursor-pointer whitespace-nowrap rounded-[18px] px-[12px] py-[4px] text-[12px] font-medium leading-[1.6] tracking-[0.6px] md:px-[16px] md:text-[16px] md:tracking-[0.8px] lg:px-[16px] lg:text-[16px] lg:tracking-[0.8px]",
      "font-noto-jp",
      active
        ? "bg-brand-green text-white font-bold"
        : "bg-white text-ink border border-brand-stone hover:bg-brand-mist",
    ].join(" ");
  const tabFontStyle = { fontFamily: '"Noto Sans JP", sans-serif' } as const;

  return (
    <section>
      <div className="w-full bg-brand-offwhite mb-6 md:mb-8 lg:mb-10">
        <div className="mx-auto w-full max-w-[1220px] px-[16px] py-4 min-[768px]:px-[10px] md:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex items-center gap-3 md:gap-4 lg:gap-4 min-w-0 lg:flex-1 lg:basis-0">
              <span
                className="shrink-0 font-noto-jp text-[12px] font-medium leading-[1.6] tracking-[0.6px] text-ink md:text-[16px] md:tracking-[0.8px] lg:text-[16px] lg:tracking-[0.8px]"
                style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
              >
                カテゴリー
              </span>
              <span
                className="shrink-0 h-7 w-px bg-slate-300"
                aria-hidden="true"
              />

              <div
                ref={categoryScrollerRef}
                className="-ml-[4px] md:ml-0 lg:ml-0 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex w-max flex-nowrap items-center gap-[4px] md:gap-[12px] lg:gap-[8px] pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("all");
                      router.push(
                        buildHrefWithYear("/category/news", activeYear)
                      );
                    }}
                    data-active={activeCategory === "all"}
                    className={getTabClassName(activeCategory === "all")}
                    style={tabFontStyle}
                  >
                    {labels.all}
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category.slug);
                        router.push(
                          buildHrefWithYear(
                            `/category/${encodeURIComponent(category.slug)}`,
                            activeYear
                          )
                        );
                      }}
                      data-active={activeCategory === category.slug}
                      className={getTabClassName(activeCategory === category.slug)}
                      style={tabFontStyle}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-start gap-3 min-w-0 lg:flex-1 lg:basis-0 lg:justify-end">
              <span
                className="shrink-0 font-noto-jp text-[12px] font-medium leading-[1.6] tracking-[0.6px] text-ink md:text-[16px] md:tracking-[0.8px] lg:text-[16px] lg:tracking-[0.8px]"
                style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
              >
                時期
              </span>
              <span
                className="shrink-0 h-7 w-px bg-slate-300"
                aria-hidden="true"
              />

              <div
                ref={yearScrollerRef}
                className="-ml-[4px] md:ml-0 lg:ml-0 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-none lg:w-auto"
              >
                <div className="flex w-max flex-nowrap items-center gap-[4px] md:gap-[12px] lg:gap-[8px] pr-1 lg:pr-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveYear("all");
                      router.replace(buildHrefWithYear(pathname, "all"));
                    }}
                    data-active={activeYear === "all"}
                    className={getTabClassName(activeYear === "all")}
                    style={tabFontStyle}
                  >
                    {labels.all}
                  </button>

                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setActiveYear(year);
                        router.replace(buildHrefWithYear(pathname, year));
                      }}
                      data-active={activeYear === year}
                      className={getTabClassName(activeYear === year)}
                      style={tabFontStyle}
                    >
                      {year}年
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NewsList
        posts={pagedPosts}
        labels={{ empty: labels.empty, all: labels.all }}
        className={shouldShowPagination ? "pb-8" : undefined}
      />

      {shouldShowPagination ? (
        <NewsPagination
          page={page}
          pageCount={totalPages}
          isMobile={isMobile}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}
