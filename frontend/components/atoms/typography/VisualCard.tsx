"use client";

import { ReactNode } from "react";
type CardProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export default function VisualCard({ title, children, className }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200  bg-white p-4 shadow-sm ${className}`}
    >
      <h3 className="mb-3 text-3xl font-semibold text-gray-900">{title}</h3>

      <div>{children}</div>
    </div>
  );
}
