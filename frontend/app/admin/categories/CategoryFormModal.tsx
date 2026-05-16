"use client";

import { useState } from "react";
import { useTranslations } from '@/utils/strings/client';
import { adminUi } from "@/app/admin/core/admin-ui";

type EditableCategory = {
  id: number;
  name: string;
  slug: string;
  intro?: string | null;
};

type Props = {
  onSave: (formData: FormData) => void;
  initialCategory?: EditableCategory | null;
  triggerLabel?: string;
  triggerClassName?: string;
  onTriggerClick?: () => void;
};

export default function CategoryFormModal({
  onSave,
  initialCategory = null,
  triggerLabel,
  triggerClassName,
  onTriggerClick,
}: Props) {
  const t = useTranslations("Admin.categories");
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(initialCategory?.id);
  const resolvedTriggerLabel = triggerLabel ?? (isEdit ? t("actions.edit") : t("add"));
  const resolvedTriggerClassName = triggerClassName ?? (isEdit ? adminUi.buttonGhost : adminUi.buttonPrimary);

  return (
    <>
      <button
        type="button"
        className={resolvedTriggerClassName}
        onClick={() => {
          onTriggerClick?.();
          setOpen(true);
        }}
      >
        {resolvedTriggerLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className={adminUi.sectionTitle}>
                {isEdit ? t("form.titleEdit") : t("form.title")}
              </h2>
              <button
                type="button"
                className={adminUi.buttonGhost}
                onClick={() => setOpen(false)}
              >
                {t("form.close")}
              </button>
            </div>
            <form
              action={onSave}
              onSubmit={() => setOpen(false)}
              className="mt-4 grid gap-4"
            >
              {isEdit ? (
                <input type="hidden" name="categoryId" value={initialCategory?.id} />
              ) : null}
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <span>
                  {t("form.name")}
                  <span className="ml-1 text-rose-600">*</span>
                </span>
                <input
                  name="name"
                  placeholder={t("form.namePlaceholder")}
                  defaultValue={initialCategory?.name ?? ""}
                  className={adminUi.input}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <span>
                  {t("form.slug")}
                  <span className="ml-1 text-rose-600">*</span>
                </span>
                <input
                  name="slug"
                  placeholder={t("form.slugPlaceholder")}
                  defaultValue={initialCategory?.slug ?? ""}
                  className={adminUi.input}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                {t("form.intro")}
                <textarea
                  name="intro"
                  defaultValue={initialCategory?.intro ?? ""}
                  className={`${adminUi.textarea} min-h-[110px]`}
                />
              </label>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className={adminUi.buttonSecondary}
                  onClick={() => setOpen(false)}
                >
                  {t("form.cancel")}
                </button>
                <button type="submit" className={adminUi.buttonPrimary}>
                  {isEdit ? t("form.update") : t("form.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
