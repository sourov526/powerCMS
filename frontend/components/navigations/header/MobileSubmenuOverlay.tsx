"use client";

import type { NavItem } from "@/data/nav";
import { useTranslations } from '@/utils/strings/client';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileSubmenuOverlay({
  item,
  onClose,
  onBack,
  locale,
  menuClicked,
}: {
  item: NavItem | null;
  onClose: () => void;
  onBack: () => void;
  locale?: string;
  menuClicked?: boolean;
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
    <section>
      <div className="flex flex-col items-center justify-center gap-8 px-6">
        {menuClicked ? (
          <div className="flex items-center gap-2">
            <Link
              href="/business"
              onClick={onClose}
              className="inline-flex items-center gap-2 hover:text-white cursor-pointer"
            >
              <span
                className={[
                  "border-b-2 border-transparent",
                  mobileNavItemTypography,
                  isActivePath("/business")
                    ? "text-brand-green-dark border-brand-green-dark !font-bold"
                    : "text-[#252422]",
                ].join(" ")}
              >
                {t(item?.label ?? "")}
              </span>
            </Link>
          </div>
        ) : (
          <h2
            className={[
              "border-b-2 border-transparent",
              mobileNavItemTypography,
              isActivePath(item?.href)
                ? "text-brand-green-dark border-brand-green-dark !font-bold"
                : "text-[#252422]",
            ].join(" ")}
          >
            {item && t(item?.label)}
          </h2>
        )}

        <ul className="text-center space-y-5 text-slate-900">
          {(item?.children ?? [])
            .filter((c) => {
              return c.device === "tablet" || c.device === "all";
            })
            .map((c) => (
              <li key={c.id}>
                {c.isExternal ? (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block py-2 text-[#252422] ${mobileNavItemTypography}`}
                  >
                    - {t(c.label)}
                  </a>
                ) : (
                  <Link
                    onClick={onClose}
                    href={c.href}
                    className={[
                      "inline-block py-2 border-b-2 border-transparent",
                      mobileNavItemTypography,
                      isActivePath(c.href)
                        ? "text-brand-green-dark border-brand-green-dark !font-bold"
                        : "text-[#252422]",
                    ].join(" ")}
                  >
                    - {t(c.label)}
                  </Link>
                )}
              </li>
            ))}
        </ul>

        <button
          type="button"
          onClick={onBack}
          className="mt-2 w-[240px] rounded-full border border-slate-900 py-3 font-normal text-slate-900 cursor-pointer"
        >
          {t("back")}
        </button>
      </div>
    </section>
  );
}
