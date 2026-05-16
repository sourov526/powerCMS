"use client";

import NextLink from "next/link";
import {
  usePathname as useNextPathname,
  useRouter as useNextRouter,
} from "next/navigation";
import { createElement, type ReactNode } from "react";
import type { Route } from "next";

function normalizePath(path: string) {
  return path || "/";
}

function normalizeHref(href: string | URL) {
  if (typeof href !== "string") return href;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  const [pathname, query = ""] = href.split("?");
  const normalized = normalizePath(pathname);
  return query ? `${normalized}?${query}` : normalized;
}

function normalizeRouterHref(href: string | URL) {
  const normalized = normalizeHref(href);
  return typeof normalized === "string" ? normalized : normalized.toString();
}

type LinkProps = {
  href: string | URL;
  className?: string;
  children?: ReactNode;
  [key: string]: unknown;
};

function LinkComponent({ href, ...props }: LinkProps) {
  const normalized = normalizeHref(href) as Route;
  return createElement(NextLink, { ...props, href: normalized });
}

type LocaleNavigationOptions = {
  scroll?: boolean;
  locale?: string;
};

function normalizeAndNavigate(
  router: ReturnType<typeof useNextRouter>,
  method: "push" | "replace",
  href: string | URL,
  options?: LocaleNavigationOptions
) {
  const { locale: _locale, ...nextOptions } = options ?? {};
  router[method](normalizeRouterHref(href), nextOptions);
}

export function useRouter() {
  const router = useNextRouter();
  return {
    ...router,
    push: (href: string | URL, options?: LocaleNavigationOptions) =>
      normalizeAndNavigate(router, "push", href, options),
    replace: (href: string | URL, options?: LocaleNavigationOptions) =>
      normalizeAndNavigate(router, "replace", href, options),
    prefetch: (href: string | URL) => router.prefetch(normalizeRouterHref(href)),
  };
}

export const Link = LinkComponent;

export function usePathname() {
  const pathname = useNextPathname();
  return pathname ? normalizePath(pathname) : pathname;
}

export function getPathname(pathname: string) {
  return normalizePath(pathname);
}
