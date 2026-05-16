"use client";

import { useLocale } from '@/utils/strings/client';
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "kwid",
] as const;
const TRACKING_STORAGE_KEY = "bc_tracking_params";
const PREVIOUS_PAGE_STORAGE_KEY = "bc_previous_page_url";
const CURRENT_PAGE_STORAGE_KEY = "bc_current_page_url";
const EXTERNAL_REF_DIR_STORAGE_KEY = "bc_ext_ref_dir";
const EXTERNAL_REF_RELOAD_STORAGE_KEY = "bc_ext_ref_reload_seen";
const LAST_INTERNAL_PATH_STORAGE_KEY = "bc_last_internal_path";

function isContactPath(pathname: string) {
  const normalized = (pathname || "").toLowerCase();
  return /^\/([a-z]{2}(?:-[a-z]{2})?)?\/?contact(\/|$)/.test(normalized);
}

function toDirectoryPath(pathname: string) {
  const raw = (pathname || "").split("?")[0]?.split("#")[0] ?? "";
  if (!raw) return "/";
  if (raw.endsWith("/")) return raw;
  if (/\.[a-z0-9]+$/i.test(raw)) {
    const lastSlash = raw.lastIndexOf("/");
    return raw.slice(0, lastSlash + 1 || 1) || "/";
  }
  return `${raw}/`;
}

export default function LanguageSetter() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tracked: Record<string, string> = {};
    TRACKING_KEYS.forEach((key) => {
      const value = params.get(key)?.trim() || "";
      if (!value) return;
      tracked[key] = value;
    });
    if (Object.keys(tracked).length === 0) return;
    try {
      const existingRaw = window.sessionStorage.getItem(TRACKING_STORAGE_KEY);
      const existing = existingRaw
        ? (JSON.parse(existingRaw) as Record<string, string>)
        : {};
      window.sessionStorage.setItem(
        TRACKING_STORAGE_KEY,
        JSON.stringify({ ...existing, ...tracked }),
      );
    } catch {
      // Ignore storage failures.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const kwidInUrl = (params.get("kwid") || "").trim();
    const referrer = (document.referrer || "").trim();
    if (!referrer || kwidInUrl) return;
    let isExternal = false;
    try {
      isExternal = new URL(referrer).origin !== window.location.origin;
    } catch {
      isExternal = false;
    }
    if (!isExternal) return;
    try {
      const existingRaw = window.sessionStorage.getItem(TRACKING_STORAGE_KEY);
      if (!existingRaw) return;
      const existing = JSON.parse(existingRaw) as Record<string, string>;
      if (!existing.kwid) return;
      const next = { ...existing };
      delete next.kwid;
      window.sessionStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentHref = window.location.href;
    const currentPathWithSearch = `${window.location.pathname}${window.location.search}`;
    const currentIsContact = isContactPath(window.location.pathname);
    try {
      // Preserve first external landing directory in session for later contact attribution
      // (e.g. external -> top -> contact), and do not overwrite once set.
      const referrer = (document.referrer || "").trim();
      if (referrer && !window.sessionStorage.getItem(EXTERNAL_REF_DIR_STORAGE_KEY)) {
        try {
          const parsed = new URL(referrer);
          if (parsed.origin !== window.location.origin) {
            window.sessionStorage.setItem(
              EXTERNAL_REF_DIR_STORAGE_KEY,
              `${parsed.origin}${toDirectoryPath(parsed.pathname)}`,
            );
            // New external landing should reset any reload marker from older sessions.
            window.sessionStorage.removeItem(EXTERNAL_REF_RELOAD_STORAGE_KEY);
          }
        } catch {
          // Ignore invalid referrer URL.
        }
      }

      const navEntry = (
        window.performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined
      );
      const navigationType = navEntry?.type || "";
      const hasExternalRefDir = Boolean(
        (window.sessionStorage.getItem(EXTERNAL_REF_DIR_STORAGE_KEY) || "").trim(),
      );
      if (!currentIsContact && hasExternalRefDir && navigationType === "reload") {
        window.sessionStorage.setItem(EXTERNAL_REF_RELOAD_STORAGE_KEY, "1");
      }

      // Keep last internal path, but do not overwrite it on contact pages.
      if (!currentIsContact) {
        window.sessionStorage.setItem(LAST_INTERNAL_PATH_STORAGE_KEY, currentPathWithSearch);
      }

      const lastCurrent = window.sessionStorage.getItem(CURRENT_PAGE_STORAGE_KEY) || "";
      if (lastCurrent && lastCurrent !== currentHref) {
        window.sessionStorage.setItem(PREVIOUS_PAGE_STORAGE_KEY, lastCurrent);
      }
      window.sessionStorage.setItem(CURRENT_PAGE_STORAGE_KEY, currentHref);
    } catch {
      // Ignore storage failures.
    }
  }, [pathname, searchParams]);

  return null;
}
