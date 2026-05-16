"use client";

import type { NavItem } from "@/data/nav";
import { useTranslations } from '@/utils/strings/client';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileMenuOverlay({
  items,
  onClose,
  onOpenSubmenu,
  locale,
}: {
  items: NavItem[];
  onClose: () => void;
  onOpenSubmenu: (id: string) => void;
  locale?: string;
}) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const mobileNavItemTypography =
    "font-noto-jp text-[14px] font-normal leading-[160%] tracking-[0.7px]";
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

  const isActivePath = (href?: string) => {
    if (!href || href === "#" || href.startsWith("http")) return false;
    if (href === "/category/news") return isNewsDetailPath(normalizedPathname);
    return normalizedPathname === href;
  };

  return (
    <section className={`w-full`}>
      <div className="flex w-full items-center justify-center">
        <ul className="flex w-full flex-col items-center gap-6 self-stretch px-6 text-center text-slate-900">
          {items
            .filter((c) => {
              return (c.device === "mobile" || c.device === "all") && c.id !== "home";
            })
            .map((item) => {
              const hasChildren = !!item.children?.length;

              if (hasChildren) {
                return (
                  <li key={item.id} className="w-full text-center">
                    <Link
                      onClick={onClose}
                      href={item.menuClicked ? "/business" : (item.href ?? "#")}
                      className={[
                        "inline-block p-0 border-b-2 border-transparent",
                        mobileNavItemTypography,
                        isActivePath(item.menuClicked ? "/business" : item.href)
                          ? "text-brand-green-dark border-brand-green-dark !font-bold"
                          : "text-[#252422]",
                      ].join(" ")}
                    >
                      {t(item.label)}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.id} className="w-full text-center">
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-block p-0 text-[#252422] ${mobileNavItemTypography}`}
                    >
                      {t(item.label)}
                    </a>
                  ) : (
                    <Link
                      onClick={onClose}
                      href={item.href ?? "#"}
                      className={[
                        "inline-block p-0 border-b-2 border-transparent",
                        mobileNavItemTypography,
                        isActivePath(item.href)
                          ? "text-brand-green-dark border-brand-green-dark !font-bold"
                          : "text-[#252422]",
                      ].join(" ")}
                    >
                      {t(item.label)}
                    </Link>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
    </section>
  );
}
