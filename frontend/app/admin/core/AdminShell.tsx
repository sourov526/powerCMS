"use client";

import AdminTour from "@/app/admin/guide/components/AdminTour";
import AdminNotifications from "@/app/admin/notifications/components/AdminNotifications";
import BackToTopButton from "@/components/news/BackToTopButton";
import { Link, usePathname } from "@/navigation";
import { useTranslations } from "@/utils/strings/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type AdminShellUser = {
  email: string;
  role: "superuser" | "author";
};

const TOUR_TARGET_BY_HREF: Record<string, string> = {
  "/admin": "nav-dashboard",
  "/admin/posts": "nav-posts",
  "/admin/categories": "nav-categories",
  "/admin/entry": "nav-entry",
  "/admin/recruit": "nav-recruit",
  "/admin/users": "nav-users",
  "/admin/guide": "nav-guide",
};

export default function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser;
  children: React.ReactNode;
}) {
  const t = useTranslations("Admin");
  const tRole = useTranslations("Admin.roles");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDetailsElement>(null);
  const navItems: {
    label: string;
    href: string;
    roles: AdminShellUser["role"][];
    icon: JSX.Element;
  }[] = useMemo(
    () => [
      {
        label: t("nav.dashboard"),
        href: "/admin",
        roles: ["superuser", "author"],
        icon: (
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path
              d="M4 5h7v7H4zm9 0h7v4h-7zM4 14h7v5H4zm9 6v-9h7v9z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        ),
      },
      {
        label: t("nav.posts"),
        href: "/admin/posts",
        roles: ["superuser", "author"],
        icon: (
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path
              d="M5 4h10l4 4v12H5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M9 12h6M9 16h6M9 8h2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        label: t("nav.categories"),
        href: "/admin/categories",
        roles: ["superuser"],
        icon: (
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path
              d="M4 6h7l2 2h7v10H4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        ),
      },
      {
        label: t("nav.recruit"),
        href: "/admin/recruit",
        roles: ["superuser", "author"],
        icon: (
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path
              d="M6 4h12v4H6zM4 10h16v10H4zM8 14h8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      // {
      //   label: t("nav.entry"),
      //   href: "/admin/entry",
      //   roles: ["superuser"],
      //   icon: (
      //     <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
      //       <path
      //         d="M6 4h12v16H6z"
      //         fill="none"
      //         stroke="currentColor"
      //         strokeWidth="1.6"
      //       />
      //       <path
      //         d="M9 8h6M9 12h6M9 16h6"
      //         fill="none"
      //         stroke="currentColor"
      //         strokeWidth="1.6"
      //         strokeLinecap="round"
      //       />
      //     </svg>
      //   ),
      // },
      {
        label: t("nav.users"),
        href: "/admin/users",
        roles: ["superuser"],
        icon: (
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path
              d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        label: t("nav.guide"),
        href: "/admin/guide",
        roles: ["superuser", "author"],
        icon: (
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path
              d="M5 5h10a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3V5Zm0 0v14a3 3 0 0 1 3-3h10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
    [t]
  );
  const availableNav = useMemo(
    () => navItems.filter((item) => item.roles.includes(user.role)),
    [navItems, user.role]
  );
  const normalizedPathname = useMemo(() => {
    const trimmedPathname = pathname.replace(/\/+$/, "");
    return trimmedPathname || "/";
  }, [pathname]);

  const isNavItemActive = (href: string) => {
    const normalizedHref = href.replace(/\/+$/, "") || "/";

    if (normalizedHref === "/admin") {
      return normalizedPathname === normalizedHref;
    }

    return (
      normalizedPathname === normalizedHref ||
      normalizedPathname.startsWith(`${normalizedHref}/`)
    );
  };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const isTourActive = () => {
      if (searchParams.get("tour") === "1") return true;
      if (typeof window === "undefined") return false;
      return window.sessionStorage.getItem("admin-tour") === "1";
    };
    if (!isTourActive()) return;

    const syncSidebar = () => {
      if (window.innerWidth <= 1024) {
        setOpen(true);
      }
    };
    syncSidebar();
    window.addEventListener("resize", syncSidebar);
    return () => window.removeEventListener("resize", syncSidebar);
  }, [searchParams]);

  useEffect(() => {
    if (profileOpen) return;
    if (profileRef.current) {
      profileRef.current.open = false;
    }
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
    if (profileRef.current) {
      profileRef.current.open = false;
    }
  }, [pathname]);

  return (
    <div
      className="min-h-screen bg-[#F4F4F2] text-[#1b1b1b] font-['Avenir_Next','Avenir','Trebuchet_MS',sans-serif] flex flex-col [--admin-header-height:72px] max-md:[--admin-header-height:58px] max-sm:[--admin-header-height:52px]"
      id="top"
    >
      <header
        data-tour="topbar"
        className="sticky top-0 z-20 grid h-[var(--admin-header-height)] w-full grid-cols-[auto_1fr_auto] items-center border-b border-primary/35 bg-primary px-6 text-white shadow-[0_6px_24px_rgba(0,0,0,0.22)] max-md:px-3 max-sm:grid-cols-[auto_auto] max-sm:gap-2"
      >
        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-white/60 bg-white text-primary shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-colors duration-200 hover:bg-white/90"
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 1024) {
                setOpen((value) => !value);
                return;
              }
              setCollapsed((value) => !value);
            }}
            aria-label={
              collapsed
                ? t("header.expandSidebar")
                : t("header.collapseSidebar")
            }
            title={
              collapsed
                ? t("header.expandSidebar")
                : t("header.collapseSidebar")
            }
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center gap-3 max-sm:hidden">
          <span className="hidden h-px w-12 bg-white/25 lg:inline-block" />
          <div className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/95 shadow-[0_6px_16px_rgba(0,0,0,0.15)] sm:text-[12px] sm:tracking-[0.14em] lg:px-4 lg:text-[14px] lg:tracking-[0.18em]">
            {t("header.title")}
          </div>
          <span className="hidden h-px w-12 bg-white/25 lg:inline-block" />
        </div>
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/60 bg-white text-primary shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-colors hover:bg-white/90 max-sm:h-9 max-sm:w-9"
            aria-label={t("header.home")}
            title={t("header.home")}
            data-tour="view-site"
          >
            <svg
              className="h-4.5 w-4.5 max-sm:h-4 max-sm:w-4"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 5c5 0 9 4.5 9 7s-4 7-9 7-9-4.5-9-7 4-7 9-7Zm0 3.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </Link>
          <div className="max-sm:scale-90 max-sm:origin-right">
            <AdminNotifications onOpen={() => setProfileOpen(false)} />
          </div>
          <details
            className="relative"
            data-tour="profile"
            ref={profileRef}
            open={profileOpen}
            onToggle={(event) =>
              setProfileOpen((event.target as HTMLDetailsElement).open)
            }
          >
            <summary className="list-none inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/60 bg-white text-[13px] leading-none text-primary shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-colors hover:bg-white/90 [&::-webkit-details-marker]:hidden">
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                <path
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span className="sr-only">{t("header.profile")}</span>
            </summary>
            <div className="absolute right-0 top-12 grid min-w-55 gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-[#1b1b1b] shadow-[0_16px_36px_rgba(15,23,42,0.18)]">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {user.email.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900 truncate">
                    {user.email}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tRole(user.role as "superuser" | "author")}
                  </div>
                </div>
              </div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
                {t("header.signedInAs")}
              </div>
              <Link
                href="/admin/profile"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 no-underline shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                <svg
                  className="h-4.5 w-4.5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                {t("header.viewProfile")}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-600 bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                  <path
                    d="M10 17l1 0m-1 0H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4m6 10 4-4-4-4m4 4H10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t("header.logout")}
              </button>
            </div>
          </details>
        </div>
      </header>
      {open ? (
        <div
          className="fixed inset-0 z-10 bg-black/35"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="flex flex-1">
        <aside
          data-tour="sidebar"
          className={`relative z-[15] border-r border-[#e1dfdc] bg-[#E4E3DF] text-[#1b1b1b] transition-all duration-300 ease-in-out min-h-full max-md:fixed max-md:left-0 max-md:top-[var(--admin-header-height)] max-md:h-[calc(100vh-var(--admin-header-height))] max-md:w-[16rem] max-md:-translate-x-full p-5 ${
            open ? "max-md:translate-x-0" : ""
          } `}
        >
          <nav className="grid gap-2">
            {availableNav.map((item) => {
              const isActive = isNavItemActive(item.href);
              const tourTarget = TOUR_TARGET_BY_HREF[item.href];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  data-tour={tourTarget}
                  className={`flex items-center rounded-xl border no-underline transition-all duration-1000 ease-in-out ${
                    isActive
                      ? "border-primary bg-primary text-white shadow-[0_8px_18px_rgba(43,182,115,0.28)]"
                      : "border-[#e1dfdc] bg-white text-[#1b1b1b] hover:border-primary/70"
                  } ${
                    collapsed
                      ? "justify-center gap-0 px-2 py-2.5 text-sm"
                      : "gap-2 px-2 py-2.5 text-sm"
                  }`}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center drop-shadow-[0_1px_2px_rgba(15,23,42,0.25)]">
                    {item.icon}
                  </span>
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all  duration-400 ease-linear ${
                      collapsed ? "w-0 opacity-0" : "opacity-100 w-32"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex w-full flex-col ">
          <main
            data-tour="content"
            className="min-w-0 flex-1 px-6 pb-6 pt-6 max-md:px-4 max-md:pb-8 max-md:pt-5 max-sm:px-3"
          >
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
      <footer className="border-t border-[#e1dfdc] bg-white px-6 py-4 text-sm text-[#5A5955] max-md:px-4">
        <div className="mx-auto w-full max-w-[1440px]">
          © 2026 Power CMS Admin
        </div>
      </footer>
      <BackToTopButton label={t("header.backToTop")} />
      <AdminTour role={user.role} />
    </div>
  );
}
