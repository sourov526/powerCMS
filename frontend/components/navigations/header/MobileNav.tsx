// components/header/MobileNav.tsx
"use client";

import type { NavItem } from "@/data/nav";
import { useEffect, useState } from "react";
import MobileMenuOverlay from "./MobileMenuOverlay";
import MobileSubmenuOverlay from "./MobileSubmenuOverlay";

type Stage = "root" | "submenu" | "";

export default function MobileNav({
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
  const [stage, setStage] = useState<Stage>("root");
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeItem = items.find((x) => x.id === activeId) ?? null;

  const closeAll = () => {
    setOpenAction(false);
    setStage("root");
    setActiveId(null);
  };

  useEffect(() => {
    const newId = document.getElementById("mobile-nav-container");
    if (newId && open) {
      newId.classList.remove("hidden");
      newId.classList.remove("opacity-0");
      newId.classList.add("opacity-100");
    }
    if (newId && !open) {
      newId.classList.remove("opacity-100");
      newId.classList.add("opacity-0");
      newId.classList.add("hidden");
    }
  }, [open]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[56px] z-[80] hidden opacity-0 transition-none duration-0 lg:hidden bg-[#F4F4F2]"
      id="mobile-nav-container"
    >
      <div className="mx-auto flex h-[812px] w-full max-w-[375px] flex-col items-center pt-12 pb-[285px]">
        <div
          className={`w-full transition-none ${
            stage === "root"
              ? "block opacity-100 pointer-events-auto select-none"
              : "hidden opacity-0 pointer-events-none select-none"
          } `}
          id="mobile-menu-root"
        >
          <MobileMenuOverlay
            items={items}
            onClose={closeAll}
            onOpenSubmenu={(id) => {
              setActiveId(id);
              setStage("submenu");
            }}
            locale={locale}
          />
        </div>

        <div
          className={`w-full transition-none ${
            stage === "submenu"
              ? "block opacity-100 pointer-events-auto select-none"
              : "hidden opacity-0 pointer-events-none select-none"
          }`}
          id="mobile-menu-submenu"
        >
          <MobileSubmenuOverlay
            item={activeItem ?? null}
            onClose={closeAll}
            onBack={() => setStage("root")}
            locale={locale}
            menuClicked={activeItem?.menuClicked}
          />
        </div>
      </div>
    </div>
  );
}
