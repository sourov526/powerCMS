"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CiSearch } from "react-icons/ci";

export function SiteSearchUI({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // const onSearch = () => {
  //   const trimmed = term.trim();
  //   const params = new URLSearchParams();
  //   params.set("s", trimmed);
  //   const query = params.toString();
  //   router.push(`/search${query ? `?${query}` : ""}`);
  //   setOpen(false);
  // };

  const onSearch = () => {
    const trimmed = term.trim();
    if (!trimmed) return;
    if (trimmed) router.push(`/search?s=${encodeURIComponent(trimmed)}`);
    setTerm("");
    setOpen(false);
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
    <div className="relative flex flex-row gap-1 items-center">
      <CiSearch className="md:h-6.5 md:w-6.5 h-5 w-5" onClick={toggleInput} />
      <input
        ref={inputRef}
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => setOpen(false)}
        placeholder={label}
        className={`w-22.5 bg-transparent p-1 focus:border border border-transparent focus:border-white outline-none   rounded-md  text-[12px] text-[#FAFAFA] placeholder:text-[#FAFAFA] focus:w-50 not-focus:w-25 transition-all duration-400
          
          `}
      />
      {/* )} */}
    </div>
  );
}
