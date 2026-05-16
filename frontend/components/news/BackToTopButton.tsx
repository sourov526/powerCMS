"use client";

import { useEffect, useState } from "react";
import { IoIosArrowUp } from "react-icons/io";

type BackToTopButtonProps = {
  label: string;
};

export default function BackToTopButton({ label }: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#top"
      aria-label={label}
      title={label}
      className={
        "fixed inline-flex bottom-3 right-3 z-21 h-6 w-6 rounded-full items-center justify-center bg-primary text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition-opacity duration-200" +
        (visible ? " opacity-100" : " pointer-events-none opacity-0")
      }
    >
      <IoIosArrowUp size={16} />
      <span className="sr-only">{label}</span>
    </a>
  );
}
