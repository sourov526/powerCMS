"use client";

import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

export default function LanguageSwitcherGate() {
  const pathname = usePathname();
  const isAdminPath = /^\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?admin(?:\/|$)/i.test(
    pathname
  );
  const isProfilePath = /^\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?profile(?:\/|$)/i.test(
    pathname
  );

  if (isAdminPath || isProfilePath) {
    return null;
  }

  return <LanguageSwitcher />;
}
