"use client";

import cn from "@/utils/cn";
import type { CSSProperties } from "react";

type ResponsiveValue = {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
};

type Props = {
  bColor?: string;
  dataCy?: string;
  direction?: "horizontal" | "vertical";
  widthValue?: string;
  heightValue?: string;
  widthByBreakpoint?: ResponsiveValue;
  heightByBreakpoint?: ResponsiveValue;
  className?: string;
};

export function Divider(props: Readonly<Props>) {
  const {
    bColor = "border-gray-300",
    dataCy,
    direction = "horizontal",
    widthValue = "100%",
    heightValue = "1px",
    widthByBreakpoint,
    heightByBreakpoint,
    className,
  } = props;

  const widthVarClassName = cn(
    "[--divider-w:var(--divider-w-base)]",
    "sm:[--divider-w:var(--divider-w-sm,var(--divider-w-base))]",
    "md:[--divider-w:var(--divider-w-md,var(--divider-w-base))]",
    "lg:[--divider-w:var(--divider-w-lg,var(--divider-w-base))]",
    "xl:[--divider-w:var(--divider-w-xl,var(--divider-w-base))]",
    "2xl:[--divider-w:var(--divider-w-2xl,var(--divider-w-base))]"
  );

  const heightVarClassName = cn(
    "[--divider-h:var(--divider-h-base)]",
    "sm:[--divider-h:var(--divider-h-sm,var(--divider-h-base))]",
    "md:[--divider-h:var(--divider-h-md,var(--divider-h-base))]",
    "lg:[--divider-h:var(--divider-h-lg,var(--divider-h-base))]",
    "xl:[--divider-h:var(--divider-h-xl,var(--divider-h-base))]",
    "2xl:[--divider-h:var(--divider-h-2xl,var(--divider-h-base))]"
  );

  const styleVars = {
    "--divider-w-base": widthByBreakpoint?.base ?? widthValue,
    "--divider-h-base": heightByBreakpoint?.base ?? heightValue,
    ...(widthByBreakpoint?.sm && { "--divider-w-sm": widthByBreakpoint.sm }),
    ...(widthByBreakpoint?.md && { "--divider-w-md": widthByBreakpoint.md }),
    ...(widthByBreakpoint?.lg && { "--divider-w-lg": widthByBreakpoint.lg }),
    ...(widthByBreakpoint?.xl && { "--divider-w-xl": widthByBreakpoint.xl }),
    ...(widthByBreakpoint?.["2xl"] && {
      "--divider-w-2xl": widthByBreakpoint["2xl"],
    }),
    ...(heightByBreakpoint?.sm && { "--divider-h-sm": heightByBreakpoint.sm }),
    ...(heightByBreakpoint?.md && { "--divider-h-md": heightByBreakpoint.md }),
    ...(heightByBreakpoint?.lg && { "--divider-h-lg": heightByBreakpoint.lg }),
    ...(heightByBreakpoint?.xl && { "--divider-h-xl": heightByBreakpoint.xl }),
    ...(heightByBreakpoint?.["2xl"] && {
      "--divider-h-2xl": heightByBreakpoint["2xl"],
    }),
  } as CSSProperties;

  if (direction === "horizontal") {
    return (
      <div
        className={cn(widthVarClassName, heightVarClassName, className)}
        style={{
          width: "var(--divider-w)",
          borderBottomWidth: "var(--divider-h)",
          borderBottomStyle: "solid",
          borderBottomColor: bColor,
          ...styleVars,
        }}
        data-cy={dataCy}
      />
    );
  }
  return (
    <div
      className={cn(widthVarClassName, heightVarClassName, className)}
      style={{
        height: "var(--divider-h)",
        borderRightWidth: "var(--divider-w)",
        borderRightStyle: "solid",
        borderRightColor: bColor,
        ...styleVars,
      }}
    />
  );
}
