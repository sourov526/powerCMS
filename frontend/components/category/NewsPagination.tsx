"use client";

import ReactPaginate from "react-paginate";

type Props = {
  page: number;
  pageCount: number;
  isMobile: boolean;
  onPageChange: (selected: number) => void;
};

export default function NewsPagination({ page, pageCount, isMobile, onPageChange }: Props) {
  if (pageCount <= 1) return null;

  return (
    <ReactPaginate
      breakLabel="..."
      nextLabel="›"
      previousLabel="‹"
      pageRangeDisplayed={isMobile ? 1 : 3}
      marginPagesDisplayed={isMobile ? 1 : 1}
      onPageChange={({ selected }) => onPageChange(selected)}
      pageCount={pageCount}
      forcePage={page}
      renderOnZeroPageCount={null}
      containerClassName="flex flex-wrap items-center justify-center gap-2 pt-4"
      pageClassName="flex"
      pageLinkClassName="flex h-8 w-8 items-center justify-center rounded border border-brand-stone bg-white text-[13px] font-medium text-ink/70 transition hover:bg-brand-mist"
      activeLinkClassName="!border-brand-green-dark !bg-brand-green-dark !text-white hover:!bg-brand-green-dark/90"
      previousClassName="flex"
      previousLinkClassName="flex h-8 w-8 items-center justify-center rounded border border-brand-stone bg-white text-lg text-ink/60 transition hover:bg-brand-mist"
      nextClassName="flex"
      nextLinkClassName="flex h-8 w-8 items-center justify-center rounded border border-brand-stone bg-white text-lg text-ink/60 transition hover:bg-brand-mist"
      disabledClassName="opacity-40 pointer-events-none"
      breakClassName="flex"
      breakLinkClassName="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-brand-stone bg-white text-[13px] font-medium text-ink/60"
      ariaLabelBuilder={(pageNumber) => `Go to page ${pageNumber}`}
    />
  );
}
