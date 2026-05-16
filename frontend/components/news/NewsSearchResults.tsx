"use client";

import type { PostItem } from "@/components/category/NewsCategoryTabs";
import NewsPagination from "@/components/category/NewsPagination";
import NewsList from "@/components/category/News_list";
import { useEffect, useMemo, useState } from "react";

type Props = {
  keyword: string;
  results: PostItem[];
  labels: {
    empty: string;
    all: string;
  };
};

const ITEMS_PER_PAGE = 10;

export default function NewsSearchResults({ keyword, results, labels }: Props) {
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [keyword]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const handleChange = (event: MediaQueryListEvent) =>
      setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const totalPages = Math.max(1, Math.ceil(results.length / ITEMS_PER_PAGE));
  const pagedResults = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return results.slice(start, start + ITEMS_PER_PAGE);
  }, [page, results]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  return (
    <section className="container pb-12 md:pb-20 lg:pb-25">
      <NewsList posts={pagedResults} labels={labels} />

      <NewsPagination
        page={page}
        pageCount={totalPages}
        isMobile={isMobile}
        onPageChange={setPage}
      />
    </section>
  );
}
