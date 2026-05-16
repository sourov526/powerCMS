"use client";

import cn from "@/utils/cn";
type HamburgerIconProps = {
  open: boolean;
  setOpenAction: (open: boolean) => void;
  barClassName?: string;
  buttonClassName?: string;
};

export default function HamburgerIcon({
  open,
  setOpenAction,
  barClassName = "bg-white",
  buttonClassName,
}: HamburgerIconProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-[36px] w-[47px] flex-col items-start justify-center gap-[6px] rounded-l-[10px] rounded-r-none bg-brand-green-dark pl-4 cursor-pointer",
        "text-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        buttonClassName
      )}
      aria-label="Toggle navigation menu"
      aria-expanded={open}
      onClick={() => {
        setOpenAction(!open);
      }}
    >
      <div className="relative h-[12px] w-[18px]">
        <span
          className={cn(
            `absolute left-0 block h-[2px] w-[18px] rounded-full transition-all duration-300 ease-out ${barClassName}`,
            open
              ? "top-1/2 -translate-y-1/2 rotate-45"
              : "top-0 rotate-0"
          )}
        />
        <span
          className={cn(
            `absolute left-0 block h-[2px] w-[14px] rounded-full transition-all duration-300 ease-out ${barClassName}`,
            open
              ? "top-1/2 -translate-y-1/2 opacity-0"
              : "top-[5px] opacity-100"
          )}
        />
        <span
          className={cn(
            `absolute left-0 block h-[2px] w-[18px] rounded-full transition-all duration-300 ease-out ${barClassName}`,
            open
              ? "top-1/2 -translate-y-1/2 -rotate-45"
              : "top-[10px] rotate-0"
          )}
        />
      </div>
    </button>
  );
}
