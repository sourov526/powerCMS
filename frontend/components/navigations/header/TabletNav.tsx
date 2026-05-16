// components/header/TabletNav.tsx
"use client";

import type { NavItem } from "@/data/nav";
import { useTranslations } from "@/utils/strings/client";
import Link from "next/link";
import { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

export default function TabletNav({
  items,
  open,
  setOpenAction,
  locale,
}: {
  items: NavItem[];
  open: boolean;
  setOpenAction: (open: boolean) => void;
  locale?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const t = useTranslations("Navigation");

  // useEffect(() => {
  // if (!open) return;
  // const prev = document.body.style.overflow;
  // document.body.style.overflow = "hidden";
  // return () => {
  //   document.body.style.overflow = prev;
  // };
  // }, [open]);

  const close = () => {
    setOpenAction(false);
    setOpenId(null);
  };

  return (
    <div
      className={`fixed right-0 top-20 w-[360px] hidden md:block lg:hidden ease-in duration-500 ${
        open
          ? " z-50 opacity-100 pointer-events-auto select-none"
          : " z-0 opacity-0  pointer-events-none select-none"
      }`}
    >
      <aside className={`bg-brand-charcoal text-white`}>
        <div className="px-6 pb-8">
          <nav>
            <ul className="space-y-4">
              {items
                .filter((c) => {
                  return c.device === "tablet" || c.device === "all";
                })
                .map((item) => {
                  const hasChildren = !!item.children?.length;
                  const isOpen = openId === item.id;

                  if (!hasChildren) {
                    return (
                      <li key={item.id}>
                        {item.isExternal ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block py-2 font-semibold text-white/90 hover:text-white"
                          >
                            <span className="font-semibold">
                              {t(item.label)}
                            </span>
                          </a>
                        ) : (
                          <Link
                            href={item.href || "/"}
                            className="block py-2 font-semibold text-white/90 hover:text-white"
                          >
                            <span className="font-semibold">
                              {t(item.label)}
                            </span>
                          </Link>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li key={item.id} className="pt-2">
                      {item.menuClicked ? (
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href="/business"
                            onClick={close}
                            className="inline-flex items-center select-none  gap-2 hover:text-white cursor-pointer"
                          >
                            <span className="font-semibold">
                              {t(item.label)}
                            </span>
                          </Link>
                          <IoIosArrowDown
                            onClick={() => setOpenId(isOpen ? null : item.id)}
                            className={`text-lg transition-transform duration-700
                                      ${isOpen && "rotate-180"}
                                    `}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : item.id)}
                          className="w-full flex items-center justify-between py-2 cursor-pointer text-white/90 hover:text-white"
                          aria-expanded={isOpen}
                        >
                          <span className="font-semibold">{t(item.label)}</span>
                          <IoIosArrowDown
                            className={`text-lg transition-transform duration-700
                                      ${isOpen && "rotate-180"}
                                    `}
                          />
                        </button>
                      )}

                      {/* Submenu (grid rows trick) */}
                      <div
                        className={[
                          "grid transition-[grid-template-rows] duration-700 ease-in-out",
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        ].join(" ")}
                      >
                        <div className="overflow-hidden">
                          <ul className="mt-2 space-y-2 pb-2">
                            {item
                              .children!.filter((c) => {
                                return (
                                  c.device === "tablet" || c.device === "all"
                                );
                              })
                              .map((c) => (
                                <li key={c.id}>
                                  {c.isExternal ? (
                                    <a
                                      href={c.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block py-2 pl-3 text-sm text-white/85 hover:text-white"
                                    >
                                      - {t(c.label)}
                                    </a>
                                  ) : (
                                    <Link
                                      href={c.href}
                                      className="block py-2 pl-3 text-sm text-white/85 hover:text-white"
                                      onClick={close}
                                    >
                                      - {t(c.label)}
                                    </Link>
                                  )}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  );
}
