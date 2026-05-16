"use client";

import { useDevice } from "@/lib/utils/usDevice";
import { useTranslations } from "@/utils/strings/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CiSearch } from "react-icons/ci";

export default function SearchButton({
  onClose = () => {},
}: {
  onClose?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("Footer.search");
  const { isMobile } = useDevice();

  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onSearch = () => {
    const trimmed = term.trim();
    if (!trimmed) return;
    router.push(`/category/news`);
    setOpen(false);
    setTerm("");
  };

  const toggleInput = () => {
    if (term.trim()) {
      onSearch();
      setTerm("");
    }
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="flex items-center rounded-[5px] p-1 gap-1 hover:bg-white/10 transition-colors">
      <button
        type="button"
        onClick={toggleInput}
        className="text-white text-xs"
      >
        <CiSearch
          className="h-[26px] w-[26px] sm:text-ink md:text-white sm:block md:hidden lg:hidden"
          color="#000"
        />
        <CiSearch
          className="h-[26px] w-[26px] sm:text-ink md:text-white hidden  md:block lg:block"
          color="#FFFFFF"
        />
      </button>

      {/* For Mobile, Desktop Device */}
      <input
        // ref={inputRef}
        type="text"
        placeholder={t("label")}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (isMobile) {
              onClose();
            }
            onSearch();
          }
          if (e.key === "Escape") {
            onClose();
            setOpen(false);
          }
        }}
        className={`
          bg-transparent w-[100px] p-1 border-none lg:text-white lg:bg-transparent lg:opacity-100 rounded-sm cursor-text md:hidden lg:block
          md:placeholder:text-white sm:placeholder:text-ink sm:focus:placeholder:text-ink/40  placeholder:text-sm
          transition-all duration-700 ease-in-out sm:focus:outline sm:focus:outline-black lg:focus:outline-white
          origin-left sm:focus:w-[260px] lg:focus:w-[160px]
        `}
      />

      {/* For tablet Device */}
      <input
        ref={inputRef}
        type="text"
        placeholder={t("label")}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setOpen(false);
            onSearch();
          }
          if (e.key === "Escape") {
            setOpen(false);
            setOpen(false);
          }
        }}
        onBlur={() => setOpen(false)}
        className={`
           outline-none border-none pl-0.5
          hidden md:block lg:hidden rounded-sm  cursor-text
          placeholder:text-white sm:placeholder:text-ink placeholder:text-xs
          transition-all duration-500 ease-in-out
          origin-left  ${
            open
              ? "md:w-[160px] opacity-100 bg-white text-ink"
              : "md:w-0 opacity-0 pointer-events-none -mr-2"
          }  
        `}
      />
    </div>
  );
}
