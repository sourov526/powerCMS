import { type ReactNode } from "react";
import cn from "@/utils/cn";

type AnimatePulseProps = {
  isActive?: boolean;
  widthClassName?: string;
  heightClassName?: string;
  className?: string;
  children?: ReactNode;
};

export default function AnimatePulse({
  isActive = true,
  widthClassName,
  heightClassName,
  className,
  children,
}: AnimatePulseProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl bg-[#EAEDF2] overflow-hidden",
        isActive && "animate-pulse",
        widthClassName,
        heightClassName,
        className,
      )}
    >
      {children}
    </div>
  );
}
