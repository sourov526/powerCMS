"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from '@/utils/strings/client';
import UserActions from "@/app/admin/users/UserActions";
import { adminUi } from "@/app/admin/core/admin-ui";
import type { User } from "@/lib/auth/users";
import NewsPagination from "@/components/category/NewsPagination";

type Props = {
  users: User[];
};

export default function UsersClient({ users }: Props) {
  const t = useTranslations("Admin.users");
  const tStatus = useTranslations("Admin.status");
  const tRole = useTranslations("Admin.roles");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const pageSize = 10;
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalized) return users;
    return users.filter((user) => {
      return (
        user.email.toLowerCase().includes(normalized) ||
        (user.name ?? "").toLowerCase().includes(normalized) ||
        user.role.toLowerCase().includes(normalized) ||
        user.status.toLowerCase().includes(normalized)
      );
    });
  }, [users, normalized]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedUsers = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [normalized]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className={adminUi.grid}>
      <label className="flex w-full max-w-full flex-col gap-2 text-sm font-semibold text-slate-700 sm:max-w-xs">
        {t("search.label")}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          className={adminUi.input}
        />
      </label>
      {pagedUsers.map((item) => (
        <div
          key={item.id}
          className={`${adminUi.card} ${adminUi.cardBody} flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}
        >
          <div className="min-w-0">
            <div className="text-base font-semibold text-slate-900 break-words">
              {item.email}
              {item.name ? <span className="ml-2 text-sm text-slate-500">({item.name})</span> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`${adminUi.badge} ${adminUi.badgeMuted}`}>
                {t("labels.role")}: {tRole(item.role as "superuser" | "author")}
              </span>
              <span
                className={`${adminUi.badge} ${
                  item.status === "active"
                    ? adminUi.badgePublished
                    : item.status === "rejected"
                    ? adminUi.badgeDanger
                    : adminUi.badgeDraft
                }`}
              >
                {t("labels.status")}: {tStatus(item.status as "active" | "pending" | "rejected")}
              </span>
            </div>
          </div>
          <div className="lg:ml-auto">
            {item.role !== "superuser" ? (
              <UserActions
                userId={item.id}
                status={
                  item.status === "active" || item.status === "rejected" ? item.status : "pending"
                }
                role={item.role}
              />
            ) : (
              <div className="text-xs font-semibold text-slate-500">{t("superuser")}</div>
            )}
          </div>
        </div>
      ))}
      {filtered.length === 0 ? (
        <div className={adminUi.empty}>
          {users.length === 0 && !normalized ? t("empty") : t("emptySearch")}
        </div>
      ) : null}
      <NewsPagination
        page={Math.min(page, pageCount - 1)}
        pageCount={pageCount}
        isMobile={isMobile}
        onPageChange={(selected) => setPage(selected)}
      />
    </div>
  );
}
