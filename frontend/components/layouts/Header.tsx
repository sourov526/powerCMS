"use client";

import { useLocale, useTranslations } from "@/utils/strings/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { IoIosArrowDown, IoMdSearch } from "react-icons/io";
import { IoGlobeOutline } from "react-icons/io5";
import { MdMailOutline } from "react-icons/md";

import { usePathname, useRouter } from "@/navigation";
import { locales } from "@/utils/strings/config";
import Image from "next/image";
import LanguageSwitcher from "../LanguageSwitcher";
import { Divider } from "../atoms/typography/Divider";
import { Flex } from "./Flex";

const DESKTOP_HEADER_HEIGHT = 80;
const MOBILE_HEADER_HEIGHT = 52;

type HeaderProps = {
  transparentOnTop?: boolean;
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function CustomDropdown({
  label,
  items,
  showPrimaryBg,
  isOpen,
  onToggle,
}: {
  label: string;
  items: { label: string; href: string }[];
  showPrimaryBg: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <button
        id="dropdownDefaultButton"
        data-dropdown-toggle="dropdown"
        className="group inline-flex items-center gap-1 py-1 font-semibold tracking-wide transition text-white cursor-pointer"
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{label}</span>
        <IoIosArrowDown
          className={cn(
            "text-lg transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        id="dropdown"
        className={cn(
          "absolute left-0 top-full z-50 mt-2 w-65 origin-top-left border",
          "grid overflow-hidden transition-all duration-500 border-none",
          isOpen
            ? "pointer-events-auto grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0",
          showPrimaryBg ? " bg-primary text-white" : " bg-white text-primary"
        )}
      >
        <div className="min-h-0">
          <ul
            className="p-2 text-sm font-medium"
            aria-labelledby="dropdownDefaultButton"
          >
            {items.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={cn(
                    "inline-flex items-center w-full rounded-xl px-3 py-2 text-[13px] font-semibold"
                  )}
                >
                  - {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Header({ transparentOnTop = true }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(DESKTOP_HEADER_HEIGHT);
  const [mobileMenuView, setMobileMenuView] = useState<
    "root" | "company" | "business"
  >("root");
  const [tabletOpenSection, setTabletOpenSection] = useState<
    "company" | "business" | null
  >(null);
  // const [openDropdown, setOpenDropdown] = useState<
  //   "company" | "business" | null
  // >(null);
  const [openCustomDropdown, setOpenCustomDropdown] = useState<
    "company" | "business" | null
  >(null);

  const t = useTranslations("Navigation");
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale();
  const searchParams = useSearchParams();
  const localeLabels: Record<(typeof locales)[number], string> = {
    en: "English",
  };

  useEffect(() => {
    const updateHeaderHeight = () => {
      setHeaderHeight(
        window.innerWidth < 768 ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT
      );
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  useEffect(() => {
    if (!transparentOnTop) return;

    const onScroll = () => setScrolled(window.scrollY > headerHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentOnTop, headerHeight]);

  // Close dropdowns when mobile menu opens
  useEffect(() => {
    // if (menuOpen) setOpenDropdown(null);
    if (menuOpen) {
      setOpenCustomDropdown(null);
      setLanguageOpen(false);
      setMobileMenuView("root");
      setTabletOpenSection(null);
    }
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const showPrimaryBg = transparentOnTop ? scrolled : true;

  const companyItems = useMemo(
    () => [
      { label: t("company.overview"), href: "#" },
      { label: t("company.difference"), href: "#" },
      { label: t("company.executives"), href: "#" },
      { label: t("company.vision"), href: "#" },
      { label: t("company.message"), href: "#" },
      { label: t("company.history"), href: "#" },
    ],
    [t]
  );

  const businessItems = useMemo(
    () => [
      { label: t("business.label"), href: "#" },
      { label: t("business.reputationCloud"), href: "#" },
      {
        label: t("business.flamePreventionCloud"),
        href: "#",
      },
      { label: t("business.brandLifting"), href: "#" },
    ],
    [t]
  );

  const mobileNavItems = useMemo(
    () => [
      { label: t("home"), href: "/" },
      { label: t("company.label"), href: "#", submenu: "company" as const },
      { label: t("business.label"), href: "#", submenu: "business" as const },
      { label: t("news"), href: "#" },
      { label: t("sustainability"), href: "#" },
      { label: t("careers"), href: "#" },
      { label: t("contact"), href: "/contact" },
    ],
    [t]
  );

  const headerClass = cn(
    "fixed top-0 z-50 w-full overflow-visible transition-colors duration-300 whitespace-nowrap",
    showPrimaryBg ? "bg-primary shadow-[15px]" : "bg-transparent"
  );

  const navLinkClass =
    " py-2 text-[14px] font-semibold tracking-wide transition text-white";

  let normalizedPathname = pathname;
  for (const locale of locales) {
    if (normalizedPathname === `/${locale}`) {
      normalizedPathname = "/";
      break;
    }
    if (normalizedPathname.startsWith(`/${locale}/`)) {
      normalizedPathname = normalizedPathname.replace(`/${locale}`, "");
      break;
    }
  }
  const search = searchParams.toString();
  const href = search ? `${normalizedPathname}?${search}` : normalizedPathname;
  const onSelectLocale = (locale: (typeof locales)[number]) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    router.replace(href, { locale });
  };

  return (
    <>
      <header className={headerClass} style={{ height: headerHeight }}>
        <div className="mx-auto flex h-full items-center justify-between md:px-6 lg:px-12.5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-2 py-2"
          >
            <Image
              src="/power-cms-logo.svg"
              alt="Power CMS"
              width={210}
              height={60}
              className="w-28.25 md:w-55 h-6 md:h-11.75"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-11.25 lg:flex">
            <CustomDropdown
              label={t("company.label")}
              items={companyItems}
              showPrimaryBg={showPrimaryBg}
              isOpen={openCustomDropdown === "company"}
              onToggle={() =>
                setOpenCustomDropdown((cur) =>
                  cur === "company" ? null : "company"
                )
              }
            />
            <CustomDropdown
              label={t("business.label")}
              items={businessItems}
              showPrimaryBg={showPrimaryBg}
              isOpen={openCustomDropdown === "business"}
              onToggle={() =>
                setOpenCustomDropdown((cur) =>
                  cur === "business" ? null : "business"
                )
              }
            />
            {/* <Dropdown
              label={t("business.label")}
              items={businessItems}
              isOpen={openDropdown === "business"}
              showPrimaryBg={showPrimaryBg}
              onToggle={() =>
                setOpenDropdown((cur) =>
                  cur === "business" ? null : "business",
                )
              }
              onClose={() => setOpenDropdown(null)}
            /> */}

            <Link href="/category/news" className={navLinkClass}>
              {t("news")}
            </Link>
            <Link href="#" className={navLinkClass}>
              {t("sustainability")}
            </Link>
            <Link href="#" className={navLinkClass}>
              {t("careers")}
            </Link>

            <Divider direction="vertical" heightValue="40px" bColor="#304266" />

            {/* <Link
              href="#"
              className={cn(
                "py-2 text-[14px] font-semibold tracking-wide transition text-white flex items-center gap-2 w-30",
              )}
            >
              <CiSearch className="mt-1 w-4.5 h-4.5 font-bold" />
              <span>{t("search")}</span>
            </Link> */}
            <form>
              <Flex
                direction="row"
                gap="4px"
                className="flex-row-reverse text-white"
              >
                <input
                  type="text"
                  placeholder={t("search")}
                  className="w-22.5 placeholder:text-white placeholder:text-xs"
                />
                <button type="submit">
                  <IoMdSearch className="text-[20px] " />
                </button>
              </Flex>
            </form>

            <Divider direction="vertical" heightValue="40px" bColor="#304266" />

            <Suspense fallback={<div className="h-5 w-30" />}>
              <LanguageSwitcher />
            </Suspense>
          </nav>

          {/* Mobile controls */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="hidden max-[767px]:flex items-center gap-3.5">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center rounded-xl ",
                  "text-white transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                )}
                aria-label="Email"
              >
                <MdMailOutline className="h-7 w-7" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center justify-center rounded-xl ",
                    "text-white transition",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  )}
                  aria-label="Language"
                  aria-expanded={languageOpen}
                  onClick={() => setLanguageOpen((open) => !open)}
                >
                  <IoGlobeOutline className="h-7 w-7" />
                </button>
                <div
                  className={cn(
                    "fixed right-0 z-50 w-30 origin-top-right border",
                    "grid overflow-hidden transition-all duration-500 border-none",
                    languageOpen
                      ? "pointer-events-auto grid-rows-[1fr] opacity-100"
                      : "pointer-events-none grid-rows-[0fr] opacity-0",
                    "bg-white text-primary"
                  )}
                  style={{ top: headerHeight }}
                >
                  <div className="min-h-0">
                    <ul className="p-3 text-sm font-semibold">
                      {locales.map((locale) => {
                        const isActive = activeLocale === locale;
                        return (
                          <li key={locale}>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectLocale(locale);
                                setLanguageOpen(false);
                              }}
                              className={cn(
                                "inline-flex items-center w-full rounded-xl px-3 py-2 text-[15px] transition-colors",
                                isActive ? "text-primary/70" : "text-primary"
                              )}
                            >
                              {localeLabels[locale]}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center rounded-xl p-2 mr-3.5 md:mr-0",
                "text-white transition ",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              )}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <div className="relative h-5 w-6 transition-all duration-700">
                <span
                  className={cn(
                    "absolute left-0 top-0 block h-0.5 w-6 bg-white transition",
                    menuOpen
                      ? "translate-y-2 rotate-225 transition-transform duration-700"
                      : ""
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-2 block h-0.5 w-6 bg-white transition",
                    menuOpen ? "opacity-0" : ""
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-4 block h-0.5 w-6 bg-white transition",
                    menuOpen
                      ? "-translate-y-2 -rotate-225 transition-transform duration-700"
                      : ""
                  )}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <div
          className={cn(
            "md:hidden fixed inset-x-0 bottom-0",
            "transition-all duration-500",
            menuOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          )}
          style={{ top: headerHeight }}
        >
          <div className="h-full bg-neutral-100 px-6 py-10 text-[#211715] text-[13px]">
            <div
              className={cn(
                "flex h-full flex-col items-center",
                "justify-center gap-12.5"
              )}
            >
              {mobileMenuView === "root" && (
                <>
                  <nav className="flex flex-col items-center justify-center gap-6  font-semibold tracking-wide">
                    {mobileNavItems.map((item) =>
                      item.submenu ? (
                        <button
                          key={item.label}
                          type="button"
                          className="text-[#211715] cursor-pointer"
                          onClick={() => setMobileMenuView(item.submenu)}
                        >
                          {item.label}
                        </button>
                      ) : (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="text-[#211715] cursor-pointer"
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      )
                    )}
                  </nav>

                  <Link
                    href="#"
                    className="inline-flex w-full max-w-sm items-center justify-between gap-3 rounded-full px-6 py-4 text-center text-[13px] font-semibold text-white shadow-md cursor-pointer -mt-5 "
                    style={{
                      background:
                        "linear-gradient(90deg, #232D47 0%, #283452 100%)",
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{t("specialSite")}</span>
                    <Image
                      src="/icons/file.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="h-4.5 w-4.5"
                    />
                  </Link>
                </>
              )}

              {mobileMenuView === "company" && (
                <>
                  <div className="flex flex-col items-start justify-center gap-12.5 text-left">
                    <h2 className="text-lg font-semibold self-center">
                      {t("company.label")}
                    </h2>
                    <div className="flex w-full flex-col gap-7.5 text-sm font-semibold tracking-wide">
                      {companyItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="text-[#211715] cursor-pointer"
                          onClick={() => setMenuOpen(false)}
                        >
                          - {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex w-37.5 h-8 items-center justify-center rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => setMobileMenuView("root")}
                  >
                    {t("back")}
                  </button>
                </>
              )}

              {mobileMenuView === "business" && (
                <>
                  <div className="flex flex-col items-start justify-center gap-12.5 text-left">
                    <h2 className="text-xl font-semibold self-center">
                      {t("business.label")}
                    </h2>
                    <div className="flex w-full flex-col gap-7.5 text-[13px] font-semibold tracking-wide">
                      {businessItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="text-[#211715] cursor-pointer"
                          onClick={() => setMenuOpen(false)}
                        >
                          - {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex w-37.5 items-center justify-center rounded-full border-2 border-primary px-6 py-3 text-[13px] font-semibold cursor-pointer"
                    onClick={() => setMobileMenuView("root")}
                  >
                    {t("back")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tablet panel */}
        <div
          className={cn(
            "hidden md:block lg:hidden absolute right-0 top-full w-62.5",
            "transition-all duration-500",
            menuOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          )}
        >
          <div className="p-4 text-white bg-primary rounded-none">
            <div className={cn("bg-primary")}>
              <div className="flex flex-col gap-4 text-white">
                {/* Company accordion */}
                <div className="text-[14px]">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-left cursor-pointer",
                      "font-semibold tracking-wide"
                    )}
                    aria-expanded={tabletOpenSection === "company"}
                    onClick={() =>
                      setTabletOpenSection((cur) =>
                        cur === "company" ? null : "company"
                      )
                    }
                  >
                    <span>{t("company.label")}</span>
                    <IoIosArrowDown
                      className={cn(
                        "text-lg transition-transform duration-500 ml-3",
                        tabletOpenSection === "company" && "rotate-180"
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "grid overflow-hidden transition-all duration-500",
                      tabletOpenSection === "company"
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div
                      className={`min-h-0 ${
                        tabletOpenSection === "company"
                          ? !scrolled
                            ? "p-5 bg-white text-primary"
                            : "p-5"
                          : "hidden"
                      }`}
                    >
                      <div className="flex flex-col gap-3.5">
                        {companyItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="rounded-xl text-[14px] font-semibold hover:bg-white/10 cursor-pointer"
                            onClick={() => setMenuOpen(false)}
                          >
                            - {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business accordion  tablet*/}
                <div className="text-[14px]">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-left cursor-pointer",
                      "font-semibold tracking-wide "
                    )}
                    aria-expanded={tabletOpenSection === "business"}
                    onClick={() =>
                      setTabletOpenSection((cur) =>
                        cur === "business" ? null : "business"
                      )
                    }
                  >
                    <span>{t("business.label")}</span>
                    <IoIosArrowDown
                      className={cn(
                        "text-lg transition-transform duration-500 ml-3",
                        tabletOpenSection === "business" && "rotate-180"
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "grid overflow-hidden transition-all duration-500",
                      tabletOpenSection === "business"
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div
                      className={`min-h-0 ${
                        tabletOpenSection === "business"
                          ? !scrolled
                            ? "p-5 bg-white text-primary"
                            : "p-5"
                          : "hidden"
                      }`}
                    >
                      <div className="flex flex-col gap-3.5">
                        {businessItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="rounded-xl text-[14px] font-semibold cursor-pointer"
                            onClick={() => setMenuOpen(false)}
                          >
                            - {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simple links */}
                <div className="grid grid-cols-1 gap-3">
                  <Link
                    href="/category/news"
                    className="rounded-xl px-3 py-2 text-[14px] font-semibold text-white/90 hover:bg-white/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("news")}
                  </Link>
                  <Link
                    href="#"
                    className="rounded-xl text-[14px] font-semibold text-white/90 hover:bg-white/10 cursor-pointer"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("sustainability")}
                  </Link>
                  <Link
                    href="#"
                    className="rounded-xl text-[14px] font-semibold text-white/90 hover:bg-white/10 cursor-pointer"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("careers")}
                  </Link>

                  <form>
                    <Flex
                      direction="row"
                      gap="4px"
                      className="flex-row-reverse text-white justify-end"
                    >
                      <input
                        type="text"
                        placeholder={t("search")}
                        className="w-22.5 placeholder:text-white placeholder:text-xs"
                      />
                      <button type="submit">
                        <IoMdSearch className="text-[20px]" />
                      </button>
                    </Flex>
                  </form>
                </div>

                <div className="pt-2">
                  <Suspense fallback={<div className="h-5 w-30" />}>
                    <LanguageSwitcher />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer */}
      {!transparentOnTop && <div style={{ height: headerHeight }} />}
    </>
  );
}
