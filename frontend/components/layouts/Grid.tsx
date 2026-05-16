import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  colCount?: number;
  className?: string;
  gap?: string;
  minWidth?: string;
  maxWidth?: string;
};

export const Grid = (props: Props) => {
  const {
    children,
    colCount = 1,
    className,
    gap,
    minWidth = 0,
    maxWidth = "1fr",
  } = props;

  return (
    <div
      className={` grid w-full ${className} `}
      style={{
        gap,
        gridTemplateColumns: `repeat(${colCount}, minmax(${minWidth}, ${maxWidth}))`,
      }}
    >
      {children}
    </div>
  );
};
