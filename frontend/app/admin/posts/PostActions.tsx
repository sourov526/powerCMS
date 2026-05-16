"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from '@/utils/strings/client';
import { useRouter } from "next/navigation";
import { adminUi } from "@/app/admin/core/admin-ui";
import ConfirmDialog from "@/app/admin/core/ConfirmDialog";
import Spinner from "@/components/atoms/Spinner";
import LoadingOverlay from "@/components/atoms/LoadingOverlay";

export default function PostActions({
  postId,
  status,
}: {
  postId: number;
  status: string;
}) {
  const router = useRouter();
  const t = useTranslations("Admin.posts.actions");
  const tCommon = useTranslations("Admin.common");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isBusy = pending || busy;

  async function publish() {
    setBusy(true);
    const response = await fetch("/api/admin/posts/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, locale }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
    setBusy(false);
  }

  async function remove() {
    setConfirmOpen(false);
    setBusy(true);
    const response = await fetch("/api/admin/posts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
    setBusy(false);
  }

  async function archive(nextStatus: "archived" | "draft") {
    setBusy(true);
    const response = await fetch("/api/admin/posts/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, status: nextStatus, locale }),
    });
    if (response.ok) {
      startTransition(() => router.refresh());
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <LoadingOverlay show={isBusy} label={t("publishing")} />
      {status !== "archived" ? (
        <button
          type="button"
          disabled={isBusy || status === "published"}
          onClick={publish}
        className={`${adminUi.buttonSuccess} ${
          status === "published" ? "cursor-not-allowed opacity-80" : ""
        }`}
      >
        {isBusy ? <Spinner size={16} label={t("publishing")} /> : null}
        <span>
          {status === "published"
            ? t("published")
            : isBusy
              ? t("publishing")
              : t("publish")}
        </span>
      </button>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => archive("draft")}
          className={`${adminUi.buttonSecondary} ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
        >
          {isBusy ? <Spinner size={16} label={t("restore")} /> : null}
          {t("restore")}
        </button>
      )}
      {status !== "archived" ? (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => archive("archived")}
          className={`${adminUi.buttonSecondary} ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
        >
          {isBusy ? <Spinner size={16} label={t("archive")} /> : null}
          {t("archive")}
        </button>
      ) : null}
      <button
        type="button"
        disabled={isBusy}
        onClick={() => setConfirmOpen(true)}
        className={`${adminUi.buttonDanger} ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
      >
        {isBusy ? <Spinner size={16} label={t("deleting")} /> : null}
        <span>{isBusy ? t("deleting") : t("delete")}</span>
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={t("delete")}
        description={t("confirmDelete")}
        confirmLabel={isBusy ? t("deleting") : t("delete")}
        cancelLabel={tCommon("cancel")}
        busy={isBusy}
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
