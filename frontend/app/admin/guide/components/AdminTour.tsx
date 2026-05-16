"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/navigation";

type TourStep = {
  id: string;
  title: string;
  description: string;
  selector: string;
};

const TOUR_STEPS: TourStep[] = [
  { id: "sidebar", title: "Sidebar", description: "Use this menu to navigate admin sections.", selector: "[data-tour='sidebar']" },
  { id: "topbar", title: "Top bar", description: "Access quick actions and account controls here.", selector: "[data-tour='topbar']" },
  { id: "dashboard", title: "Dashboard", description: "Overview of site activity and recent updates.", selector: "[data-tour='nav-dashboard']" },
  { id: "posts", title: "Posts", description: "Create and manage content posts.", selector: "[data-tour='nav-posts']" },
  { id: "categories", title: "Categories", description: "Manage post categories.", selector: "[data-tour='nav-categories']" },
  { id: "recruit", title: "Recruit", description: "Manage recruitment content.", selector: "[data-tour='nav-recruit']" },
  { id: "users", title: "Users", description: "Manage user accounts and roles.", selector: "[data-tour='nav-users']" },
  { id: "guide", title: "Guide", description: "Open help and documentation.", selector: "[data-tour='nav-guide']" },
  { id: "notifications", title: "Notifications", description: "Check recent notifications.", selector: "[data-tour='notifications']" },
  { id: "profile", title: "Profile", description: "Open your profile and account actions.", selector: "[data-tour='profile']" },
  { id: "content", title: "Content area", description: "This is where section content is displayed.", selector: "[data-tour='content']" },
];

export default function AdminTour({ role }: { role: "superuser" | "author" }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [viewportHeight, setViewportHeight] = useState(800);
  const searchKey = searchParams.toString();

  const leaveTour = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("admin-tour");
    }
    setActive(false);
    try {
      router.push("/admin/guide");
    } catch {
      if (typeof window !== "undefined") {
        window.location.assign("/admin/guide");
      }
    }
  };

  const hasRectChanged = (prev: DOMRect | null, next: DOMRect) => {
    if (!prev) return true;
    return (
      prev.top !== next.top ||
      prev.left !== next.left ||
      prev.width !== next.width ||
      prev.height !== next.height
    );
  };

  const isAdminPath = useMemo(() => pathname === "/admin" || pathname.startsWith("/admin/"), [pathname]);

  const isTourEnabled = useMemo(() => {
    if (!isAdminPath) return false;
    if (searchParams.get("tour") === "1") return true;
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("admin-tour") === "1";
  }, [searchParams, isAdminPath]);

  useEffect(() => {
    if (!isTourEnabled) {
      setActive(false);
      setStepIndex(0);
      return;
    }
    setActive(true);
    setStepIndex(0);
  }, [isTourEnabled, searchKey]);

  useEffect(() => {
    if (!active) return;

    const steps = role === "superuser" ? TOUR_STEPS : TOUR_STEPS.filter((item) => !["categories", "users"].includes(item.id));
    const step = steps[stepIndex];
    if (!step) {
      setStepIndex(0);
      return;
    }

    const target = document.querySelector(step.selector) as HTMLElement | null;
    if (target) target.scrollIntoView({ block: "center", behavior: "smooth" });

    const updateRect = () => {
      setViewportWidth((prev) => (prev === window.innerWidth ? prev : window.innerWidth));
      setViewportHeight((prev) => (prev === window.innerHeight ? prev : window.innerHeight));
      if (!target) {
        setTargetRect((prev) => (prev === null ? prev : null));
        return;
      }
      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setTargetRect((prev) => (prev === null ? prev : null));
        return;
      }
      setTargetRect((prev) => (hasRectChanged(prev, rect) ? rect : prev));
    };

    updateRect();
    const raf = window.requestAnimationFrame(() => updateRect());
    const settle = window.setTimeout(() => updateRect(), 320);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [active, stepIndex, role]);

  if (!active) return null;

  const steps = role === "superuser" ? TOUR_STEPS : TOUR_STEPS.filter((item) => !["categories", "users"].includes(item.id));
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const tooltipStyle = (() => {
    const tooltipWidth = Math.min(320, viewportWidth - 32);
    const tooltipHeight = 180;
    if (!targetRect || !step) return { top: 96, left: 16 };

    let top = targetRect.top + targetRect.height + 12;
    if (top + tooltipHeight > viewportHeight) top = targetRect.top - tooltipHeight - 12;
    top = Math.max(16, Math.min(top, viewportHeight - tooltipHeight - 16));

    const left = Math.min(viewportWidth - tooltipWidth - 16, Math.max(16, targetRect.left));
    return { top, left };
  })();

  if (!step) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45" />
      {targetRect ? (
        <div
          className="fixed z-50 rounded-xl border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] pointer-events-none"
          style={{ top: targetRect.top - 6, left: targetRect.left - 6, width: targetRect.width + 12, height: targetRect.height + 12 }}
        />
      ) : null}
      <div className="fixed z-[60] rounded-xl border border-[#e1dfdc] bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.2)]" style={{ ...tooltipStyle, width: Math.min(320, viewportWidth - 32) }}>
        <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#777]">Step {stepIndex + 1} of {steps.length}</div>
        <div className="mt-2 text-[16px] font-semibold text-[#1b1b1b]">{step.title}</div>
        <p className="mt-2 text-[13px] text-[#555]">{step.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={leaveTour} className="text-[13px] font-medium text-[#555] hover:text-[#1b1b1b]">Skip</button>
          <button
            type="button"
            onClick={() => {
              if (isLast) {
                leaveTour();
                return;
              }
              setStepIndex(stepIndex + 1);
            }}
            className="rounded-full border border-[#1b1b1b] bg-[#1b1b1b] px-4 py-2 text-[13px] font-semibold text-white"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}
