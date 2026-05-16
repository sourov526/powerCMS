import cn from "@/utils/cn";
import { MdMailOutline } from "react-icons/md";

type Props = {
  locale?: string;
  className?: string;
  iconClassName?: string;
};

export const ContactIcon = (props: Props) => {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-xl cursor-pointer transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        props.className ?? "text-white"
      )}
      aria-label="Email"
      onClick={() => {
        window.location.href = "/company";
      }}
    >
      <MdMailOutline className={props.iconClassName ?? "h-7 w-7"} />
    </button>
  );
};
