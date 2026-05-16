"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function FooterActiveLink({
  href,
  className,
  activeClassName,
  children,
}: {
  href: string;
  className: string;
  activeClassName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const normalizePathname = (value: string) =>
    (value || "/").replace(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/, "") || "/";
  const normalizedPathname = normalizePathname(pathname);
  const knownTopLevelRoutes = new Set([
    "/",
    "/business",
    "/products",
    "/cases",
    "/company",
    "/ir",
    "/recruit",
    "/contact",
    "/category",
  ]);
  const isNewsDetailPath = (value: string) => {
    if (!value || value === "/") return false;
    if (value.startsWith("/category/news")) return true;
    if (value.startsWith("/admin")) return false;
    if (value.startsWith("/category/")) return false;
    if (value.split("/").length !== 2) return false;
    return !knownTopLevelRoutes.has(value);
  };
  const isActive =
    href === "/category/news"
      ? isNewsDetailPath(normalizedPathname)
      : normalizedPathname === href;

  return (
    <Link
      href={href}
      className={[className, isActive ? activeClassName : ""].join(" ").trim()}
    >
      {children}
    </Link>
  );
}
