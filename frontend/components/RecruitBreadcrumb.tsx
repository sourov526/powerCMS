"use client";

import { useTranslations } from "@/utils/strings/client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type RecruitBreadcrumbProps = {
  className?: string;
  items?: Array<{ label: string; href?: string }>;
};

export default function RecruitBreadcrumb({
  className = "",
  items,
}: RecruitBreadcrumbProps) {
  const t = useTranslations("RecruitPage");
  const pathname = usePathname();
  const segments = pathname
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean);
  const pathWithoutLocale = `/${segments.join("/")}`;

  if (!pathWithoutLocale.startsWith("/recruit")) return null;
  if (pathWithoutLocale === "/recruit") return null;
  if (segments.length === 0) return null;

  const localePrefix = "";
  const displaySegments = segments;
  let builtPath = `${localePrefix}/recruit`;
  const segmentLabels: Record<string, string> = {
    recruit: t("breadcrumb.recruit"),
    entry: t("breadcrumb.entry"),
    "job-page": t("breadcrumb.job-page"),
  };
  const filteredSegments =
    displaySegments[0] === "recruit"
      ? displaySegments.slice(1)
      : displaySegments;

  const breadcrumbItems = items;

  if (breadcrumbItems?.length) {
    return (
      <nav
        aria-label="Recruit breadcrumb"
        className={`container text-[14px] lg:text-[16px] text-ink font-noto-jp ${className}`.trim()}
      >
        <ol className="flex flex-wrap items-center gap-2">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return (
              <li
                key={`${item.label}-${index}`}
                className="flex items-center gap-2"
              >
                {index > 0 && <span className="select-none">&gt;</span>}
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span className="whitespace-normal text-[14px] lg:text-[16px] text-ink">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Recruit breadcrumb"
      className={`container text-[16px] md:text-[18px] text-ink font-noto-jp ${className}`.trim()}
    >
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href={`${localePrefix}/recruit`} className="hover:underline">
            {t("breadcrumb.recruit")}
          </Link>
        </li>
        {filteredSegments.map((seg, index) => {
          builtPath += `/${seg}`;
          const isLast = index === filteredSegments.length - 1;
          const label = segmentLabels[seg] ?? seg.replace(/-/g, " ");

          return (
            <li key={builtPath} className="flex items-center gap-2">
              <span className="select-none">&gt;</span>
              {isLast ? (
                <span>{label}</span>
              ) : (
                <Link href={builtPath} className="hover:underline">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
