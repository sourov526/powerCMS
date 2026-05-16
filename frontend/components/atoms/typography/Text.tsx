"use client";

type Props = {
  text: string;
  isTitleVisible?: boolean;
  className?: string;
  isLegendText?: boolean;
  isBold?: boolean;
  dataCy?: string;
  isRequired?: boolean;
  onClick?: () => void;
};

export const Text = (props: Props) => {
  const {
    text,
    isTitleVisible = false,
    className,
    isBold = false,
    dataCy,
    isRequired = false,
    onClick,
    isLegendText,
  } = props;

  const role = onClick ? "button" : undefined;
  const tabIndex = onClick ? 0 : undefined;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <span
      className={`whitespace-normal ${className} ${
        isLegendText && "md:text-[20px]"
      } ${isBold && "font-bold"} `}
      title={isTitleVisible ? text : undefined}
      data-cy={dataCy}
      {...(onClick
        ? {
            onClick: onClick,
            role: role,
            tabIndex: tabIndex,
            onKeyDown: handleKeyDown,
          }
        : {})}
    >
      {text}
      {isRequired && (
        <Text text="*" isBold className="text-cast pl-2  md:text-[20px]" />
      )}
    </span>
  );
};
