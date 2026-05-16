"use client";

import { useEffect } from "react";

type PlausibleFn = (eventName: string, options?: { props?: Record<string, string> }) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

const SCROLL_MILESTONES = [25, 50, 75, 100];

export default function AnalyticsEvents() {
  useEffect(() => {
    const sentScroll = new Set<number>();
    const send = (eventName: string, props?: Record<string, string>) => {
      if (typeof window.plausible === "function") {
        window.plausible(eventName, props ? { props } : undefined);
      }
    };

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrolled = Math.round((scrollTop / Math.max(1, scrollHeight - clientHeight)) * 100);
      SCROLL_MILESTONES.forEach((milestone) => {
        if (scrolled >= milestone && !sentScroll.has(milestone)) {
          sentScroll.add(milestone);
          send("Scroll Depth", { percent: String(milestone) });
        }
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const cta = target.closest("[data-cta]") as HTMLElement | null;
      if (cta) {
        send("CTA Click", { label: cta.dataset.cta || "cta" });
      }

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("/") || href.startsWith("#")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) {
          send("Outbound Click", { url: url.toString() });
        }
      } catch {
        // Ignore invalid URLs.
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
