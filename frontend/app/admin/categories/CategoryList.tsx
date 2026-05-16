"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from '@/utils/strings/client';
import { Link } from "@/navigation";
import { adminUi } from "@/app/admin/core/admin-ui";
import NewsPagination from "@/components/category/NewsPagination";
import type { Category } from "@/lib/services/posts";
import CategoryFormModal from "@/app/admin/categories/CategoryFormModal";

type Props = {
  categories: Category[];
  canEdit: boolean;
  canDelete: boolean;
  onSave: (formData: FormData) => void;
  onDelete: (formData: FormData) => void;
};

export default function CategoryList({
  categories,
  canEdit,
  canDelete,
  onSave,
  onDelete,
}: Props) {
  const t = useTranslations("Admin.categories");
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(categories.length / pageSize));
  const pagedCategories = useMemo(() => {
    const start = page * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, page, pageSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      const target = event.target as Node | null;
      if (target && !menuRef.current.contains(target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={adminUi.grid}>
      {pagedCategories.map((category) => (
        <div
          key={category.id}
          className={`${adminUi.card} ${adminUi.cardBody} flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}
        >
          <div className="min-w-0">
            <div className="text-base font-semibold text-slate-900 break-words">{category.name}</div>
            <div className="mt-1 text-xs text-slate-500 break-all">{category.slug}</div>
            <div className="mt-1 text-xs text-slate-500">
              {category.createdByUser
                ? t("createdBy", {
                    name: category.createdByUser.name || category.createdByUser.email,
                  })
                : t("createdByUnknown")}
            </div>
          </div>
          <div
            className="relative flex items-center gap-2 lg:ml-auto"
            ref={openMenuId === category.id ? menuRef : null}
          >
            <button
              type="button"
              onClick={() =>
                setOpenMenuId((prev) => (prev === category.id ? null : category.id))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              aria-haspopup="menu"
              aria-expanded={openMenuId === category.id}
              aria-label={t("actions.more")}
              title={t("actions.more")}
            >
              <span className="text-lg leading-none">⋮</span>
            </button>
            {openMenuId === category.id ? (
              <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <Link
                  href={`/admin/categories/${category.slug}`}
                  className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setOpenMenuId(null)}
                >
                  {t("actions.view")}
                </Link>
                {canEdit ? (
                  <div className="rounded-md px-1 py-1">
                    <CategoryFormModal
                      onSave={onSave}
                      initialCategory={category}
                      triggerLabel={t("actions.edit")}
                      triggerClassName="w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    />
                  </div>
                ) : null}
                {canDelete ? (
                  <form action={onDelete}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button
                      type="submit"
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                    >
                      {t("actions.delete")}
                    </button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ))}
      <NewsPagination
        page={Math.min(page, pageCount - 1)}
        pageCount={pageCount}
        isMobile={isMobile}
        onPageChange={(selected) => setPage(selected)}
      />
    </div>
  );
}
