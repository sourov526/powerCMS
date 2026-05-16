"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import AdminAuthHeader from "@/components/admin/admin/AdminAuthHeader";

export default function HeaderGate() {
  const pathname = usePathname();
  const isAdminAuth = /^\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?admin\/(login|register|forgot-password|reset-password)(?:\/|$)/i.test(
    pathname
  );

  if (isAdminAuth) {
    return <AdminAuthHeader />;
  }

  return <Header transparentOnTop={false} />;
}
