"use client";

import { adminUi } from "@/app/admin/core/admin-ui";
import ConfirmDialog from "@/app/admin/core/ConfirmDialog";
import NewsPagination from "@/components/category/NewsPagination";
import type { ContactWithMailDelivery } from "@/lib/services/contacts";
import { useTranslations } from '@/utils/strings/client';
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

type ContactItem = Omit<ContactWithMailDelivery, "createdAt"> & {
  createdAt: string | Date;
};

type Props = {
  contacts: ContactItem[];
  onDelete: (formData: FormData) => void;
};

export default function ContactsClient({
  contacts,
  onDelete,
}: Props) {
  const t = useTranslations("Admin.contacts");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement | null>(null);

  const normalized = query.trim().toLowerCase();
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!normalized) return contacts;
    return contacts.filter((contact) => {
      return (
        contact.companyName.toLowerCase().includes(normalized) ||
        contact.name.toLowerCase().includes(normalized) ||
        contact.email.toLowerCase().includes(normalized) ||
        contact.message.toLowerCase().includes(normalized) ||
        contact.contactNumber.toLowerCase().includes(normalized)
      );
    });
  }, [contacts, normalized]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedContacts = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    setPage(0);
  }, [normalized]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const formatEmailStatus = (mailDelivery: ContactWithMailDelivery["mailDelivery"]) => {
    const key = mailDelivery?.status ?? "none";
    return t(`emailStatus.${key}`);
  };

  const requestDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteFormRef.current || deleteId === null) return;
    const formData = new FormData(deleteFormRef.current);
    formData.set("contactId", String(deleteId));
    onDelete(formData);
    setConfirmOpen(false);
    setDeleteId(null);
  };

  return (
    <div className={adminUi.grid}>
      <form ref={deleteFormRef} action={onDelete}>
        <input type="hidden" name="contactId" value={deleteId ?? ""} />
      </form>

      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        <a href="/api/contacts/export" className={adminUi.buttonPrimary} download>
          {t("export")}
        </a>
      </div>

      <label className="flex w-full max-w-full flex-col gap-2 text-sm font-semibold text-slate-700 sm:max-w-xs">
        {t("search.label")}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          className={adminUi.input}
        />
      </label>

      {isMobile ? (
        <div className="grid gap-3">
          {filtered.length === 0 ? (
            <div className={adminUi.empty}>
              {contacts.length === 0 && !normalized ? t("empty") : t("emptySearch")}
            </div>
          ) : (
            pagedContacts.map((contact) => (
              <div key={contact.id} className={`${adminUi.card} ${adminUi.cardBody} space-y-2`}>
                <div className="text-base font-semibold text-slate-900 break-words">{contact.name}</div>
                <div className="text-sm text-slate-600 break-all">{contact.email}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{formatEmailStatus(contact.mailDelivery)}</span>
                  <span>•</span>
                  <span>{new Date(contact.createdAt).toLocaleString("ja-JP")}</span>
                </div>
                <div className="text-sm text-slate-700 break-words">
                  <strong>{t("table.department")}: </strong>
                  {contact.department}
                </div>
                <div className="text-sm text-slate-700 break-words">
                  <strong>{t("detail.company")}: </strong>
                  {contact.companyName}
                </div>
                <div className="text-sm text-slate-700 break-words">
                  <strong>{t("detail.inquiry")}: </strong>
                  {contact.message}
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => requestDelete(contact.id)}
                    className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    {t("actions.delete")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className={`${adminUi.card} overflow-visible`}>
          <div className="overflow-x-auto">
            <table className="min-w-[1060px] w-full table-fixed text-sm text-slate-700">
            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[280px]" />
              <col className="w-[140px]" />
              <col className="w-[180px]" />
              <col className="w-[200px]" />
              <col className="w-[110px]" />
            </colgroup>
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold">{t("table.name")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("table.email")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("emailStatus.status")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("table.department")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("table.created")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    {contacts.length === 0 && !normalized ? t("empty") : t("emptySearch")}
                  </td>
                </tr>
              ) : (
                pagedContacts.map((contact) => (
                  <Fragment key={contact.id}>
                    <tr
                      className="border-b border-slate-100 cursor-pointer"
                      onClick={() =>
                        setExpandedId((prev) => (prev === contact.id ? null : contact.id))
                      }
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 truncate" title={contact.name}>
                        {contact.name}
                      </td>
                      <td className="px-4 py-3 truncate" title={contact.email}>
                        {contact.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatEmailStatus(contact.mailDelivery)}</td>
                      <td className="px-4 py-3 truncate" title={contact.department}>
                        {contact.department}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(contact.createdAt).toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            requestDelete(contact.id);
                          }}
                          className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          {t("actions.delete")}
                        </button>
                      </td>
                    </tr>

                    {expandedId === contact.id ? (
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <td colSpan={6} className="px-4 py-4 text-sm text-slate-700">
                          <div className="grid gap-2 md:grid-cols-2">
                            <div>
                              <strong>{t("detail.company")}: </strong>
                              {contact.companyName}
                            </div>
                            <div>
                              <strong>{t("table.department")}: </strong>
                              {contact.department}
                            </div>
                            <div>
                              <strong>{t("detail.contactNumber")}: </strong>
                              {contact.contactNumber}
                            </div>
                            <div>
                              <strong>{t("table.schedule")}: </strong>
                              {contact.schedule}
                            </div>
                            <div className="md:col-span-2">
                              <strong>{t("detail.inquiry")}: </strong>
                              {contact.message}
                            </div>
                            <div>
                              <strong>{t("detail.utmTerm")}: </strong>
                              {contact.utmTerm || "-"}
                            </div>
                            <div>
                              <strong>{t("detail.kwid")}: </strong>
                              {contact.kwid || "-"}
                            </div>
                            <div>
                              <strong>{t("emailStatus.title")}: </strong>
                              {formatEmailStatus(contact.mailDelivery)}
                            </div>
                            <div>
                              <strong>{t("emailStatus.error")}: </strong>
                              {contact.mailDelivery?.error || "-"}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {pageCount > 1 ? (
        <NewsPagination
          page={page}
          pageCount={pageCount}
          isMobile={isMobile}
          onPageChange={(selected) => setPage(selected)}
        />
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={t("confirmDelete")}
        description={t("confirmDeleteDescription")}
        confirmLabel={t("actions.delete")}
        cancelLabel={t("actions.cancel")}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
