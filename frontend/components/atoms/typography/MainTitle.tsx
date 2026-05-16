"use client";

type Props = {
  text: string;
  feature: "item" | "header";
  isBold?: boolean;
  className?: string;
  dataCy?: string;
};

export function MainTitle(props: Props) {
  const { text, className, feature, dataCy, isBold = true } = props;
  return (
    <span
      className={`font-noto-jp
            ${isBold && `font-bold`}
            ${feature === "item" && "text-[28px] md:text-[22px] sm:text-[18px]"}
            ${
              feature === "header" &&
              "text-[40px] md:text-[28px] sm:text-[22px]"
            }
            ${className}
          `}
      data-cy={dataCy}
    >
      {text}
    </span>
  );
}
