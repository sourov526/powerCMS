// components/header/DesktopNav.tsx
"use client";

import type { NavItem } from "@/data/nav";
import { useTranslations } from '@/utils/strings/client';
import Link from "next/link";
import { IoIosArrowDown } from "react-icons/io";

export default function DesktopNav({
  items,
  locale,
  setOpenId,
  openId,
}: {
  items: NavItem[];
  locale?: string;
  setOpenId: (id: string | null) => void;
  openId: string | null;
}) {
  // const [openId, setOpenId] = useState<string | null>(null);
  const t = useTranslations("Navigation");

  return (
    <nav className="relative">
      <ul className="flex items-center gap-8 text-white/90">
        {items
          .filter((c) => {
            return c.device === "desktop" || c.device === "all";
          })
          .map((item) => {
            const hasChildren = !!item.children?.length;
            const open = openId === item.id;

            if (!hasChildren) {
              return (
                <li key={item.id}>
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-white cursor-pointer"
                    >
                      <span className="font-semibold">{t(item.label)}</span>
                    </a>
                  ) : (
                    <Link
                      href={item.href || "/"}
                      className="inline-flex items-center gap-2 hover:text-white cursor-pointer"
                    >
                      <span className="font-semibold">{t(item.label)}</span>
                    </Link>
                  )}
                </li>
              );
            }

            return (
              <li key={item.id} className="relative">
                {/* Button */}
                {item.menuClicked ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/business"
                      onClick={() => setOpenId(null)}
                      className="inline-flex items-center select-none  gap-2 hover:text-white cursor-pointer"
                    >
                      <span className="font-semibold">{t(item.label)}</span>
                    </Link>
                    <IoIosArrowDown
                      onClick={() => setOpenId(open ? null : item.id)}
                      className={`
                              text-lg transition-transform cursor-pointer duration-200
                              ${open && "rotate-180"}
                            `}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="inline-flex items-center gap-2 hover:text-white cursor-pointer"
                    aria-expanded={open}
                  >
                    <span className="font-semibold">{t(item.label)}</span>

                    {/* Arrow rotate */}
                    <IoIosArrowDown
                      className={`
                              text-lg transition-transform duration-200
                              ${open && "rotate-180"}
                            `}
                    />
                  </button>
                )}

                {/* Dropdown */}
                <div
                  className={[
                    "absolute left-0 top-full mt-3 w-64 rounded-md bg-brand-charcoal text-white shadow-lg",
                    "transition-opacity duration-800",
                    open ? "" : " pointer-events-none",
                  ].join(" ")}
                >
                  {/* grid rows trick */}
                  <div
                    className={[
                      "grid transition-[grid-template-rows] duration-700 ease-in-out",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <ul className="py-3">
                        {item
                          .children!.filter((c) => {
                            return c.device === "desktop" || c.device === "all";
                          })
                          .map((c) => (
                            <li key={c.id}>
                              {c.isExternal ? (
                                <a
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  href={`${c.href}`}
                                  className="block px-5 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                                >
                                  {t(c.label)}
                                </a>
                              ) : (
                                <Link
                                  href={c.href}
                                  onClick={() => setOpenId(null)}
                                  className="block px-5 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10"
                                >
                                  {t(c.label)}
                                </Link>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
