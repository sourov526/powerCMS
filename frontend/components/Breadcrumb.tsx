"use client";

import {
  BREADCRUMB_HOME_LABEL_KEY,
  BREADCRUMB_SEGMENT_LABEL_KEYS,
} from "@/data/breadcrumbs";
import { useTranslations } from "@/utils/strings/client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// to decode the last title of URL properly in case of special characters in blog titles
function safeDecode(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function prettify(segment: string) {
  const decoded = safeDecode(segment);
  return decoded.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumbs({
  labels,
  prependItems,
  className,
  separator = ">",
  listClassName,
  linkClassName,
  currentClassName,
  separatorClassName,
}: {
  labels?: Record<string, string>;
  prependItems?: Array<{ path: string; label: string }>;
  className?: string;
  separator?: string;
  listClassName?: string;
  linkClassName?: string;
  currentClassName?: string;
  separatorClassName?: string;
}) {
  const t = useTranslations("BreadCrumbLabels");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segments = pathname
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean);

  // If you're on home page, show nothing (or show Home only)
  if (segments.length === 0) return null;

  const localePrefix = "";
  const displaySegments = segments;
  const isSearchPage = displaySegments[0] === "search";
  const searchKeyword = isSearchPage ? searchParams.get("s")?.trim() ?? "" : "";

  const homeHref = localePrefix || "/";
  let builtPath = localePrefix;
  const localizedHomeLabel = BREADCRUMB_HOME_LABEL_KEY
    ? t(BREADCRUMB_HOME_LABEL_KEY)
    : "Home";
  const totalItems = (prependItems?.length ?? 0) + displaySegments.length;
  const prependCount = prependItems?.length ?? 0;

  return (
    <nav
      aria-label="Breadcrumb"
      className={[
        "breadcrumb-shell",
        "text-ink font-normal text-[14px] overflow-hidden whitespace-nowrap font-noto-jp",
        className ?? "",
      ].join(" ")}
    >
      <ol className={["flex flex-wrap items-center gap-2", listClassName ?? ""].join(" ")}>
        <li>
          <Link href={homeHref} className={linkClassName ?? "hover:underline"}>
            {labels?.["/"] ?? localizedHomeLabel}
          </Link>
        </li>

        {prependItems?.map((item, idx) => {
          const isLast = idx === totalItems - 1;
          return (
            <li key={`${item.path}-${idx}`} className="flex items-center gap-2">
              <span className={["select-none", separatorClassName ?? ""].join(" ")}>
                {separator}
              </span>
              {isLast ? (
                <span className={currentClassName ?? ""}>{item.label}</span>
              ) : (
                <Link href={item.path} className={linkClassName ?? "hover:underline"}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}

        {displaySegments.map((seg, idx) => {
          builtPath += `/${seg}`;
          const isLast = idx + prependCount === totalItems - 1;
          const isCategoryRootSegment = idx === 0 && seg === "category";

          // Hide the "category" root segment (we show the news/category label elsewhere).
          if (idx === 0 && seg === "category" && displaySegments.length > 1) {
            return null;
          }

          const normalizedBuiltPath =
            builtPath.replace(localePrefix, "") || "/";
          const mappedKey = BREADCRUMB_SEGMENT_LABEL_KEYS[seg];
          const mappedLabel = mappedKey ? t(mappedKey) : undefined;
          const label =
            labels?.[normalizedBuiltPath] ??
            labels?.[builtPath] ??
            labels?.[builtPath.replace(localePrefix, "")] ??
            mappedLabel ??
            prettify(seg);

          return (
            <li key={builtPath} className="flex items-center gap-2">
              <span className={["select-none", separatorClassName ?? ""].join(" ")}>
                {separator}
              </span>

              {isLast ? (
                <span className={currentClassName ?? ""}>{label}</span>
              ) : (
                <Link
                  href={
                    isCategoryRootSegment
                      ? `${localePrefix}/category/news`
                      : builtPath
                  }
                  className={linkClassName ?? "hover:underline"}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
        {isSearchPage && searchKeyword && (
          <li className="flex items-center gap-2">
            <span className={["select-none", separatorClassName ?? ""].join(" ")}>
              {separator}
            </span>
            <span className={currentClassName ?? ""}>
              {t("SearchResultsFor", { keyword: searchKeyword })}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}
