"use client";

import { useState, useTransition } from "react";
import { useTranslations } from '@/utils/strings/client';
import { useRouter } from "next/navigation";
import { adminUi } from "@/app/admin/core/admin-ui";
import Spinner from "@/components/atoms/Spinner";
import LoadingOverlay from "@/components/atoms/LoadingOverlay";

export default function UserActions({
  userId,
  status,
  role,
}: {
  userId: number;
  status: "active" | "pending" | "rejected";
  role: "superuser" | "author";
}) {
  const router = useRouter();
  const t = useTranslations("Admin.users.actions");
  const [message, setMessage] = useState("");
  const [localStatus, setLocalStatus] = useState(status);
  const [localRole, setLocalRole] = useState(role);
  const [nextRole, setNextRole] = useState(role);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const isBusy = pending || busy;

  async function updateStatus(nextStatus: "active" | "rejected") {
    setMessage("");
    setBusy(true);
    const response = await fetch("/api/admin/users/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, status: nextStatus }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
      const error = typeof data?.error === "string" ? data.error : null;
      setMessage(error ?? t("errors.update"));
      setBusy(false);
      return;
    }
    setLocalStatus(nextStatus);
    startTransition(() => router.refresh());
    setBusy(false);
  }

  async function updateRole() {
    if (nextRole === localRole) return;
    setMessage("");
    setBusy(true);
    const response = await fetch("/api/admin/users/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, role: nextRole }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
      const error = typeof data?.error === "string" ? data.error : null;
      setMessage(error ?? t("errors.roleUpdate"));
      setBusy(false);
      return;
    }
    setLocalRole(nextRole);
    startTransition(() => router.refresh());
    setBusy(false);
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-start gap-2 lg:w-auto lg:justify-end">
      <LoadingOverlay show={isBusy} label="Loading" />
      {localStatus === "rejected" ? (
        <span className="text-xs font-semibold text-slate-500">{t("removed")}</span>
      ) : localStatus === "pending" ? (
        <>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => updateStatus("active")}
            className={`${adminUi.buttonPrimary} ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {isBusy ? <Spinner size={16} label={t("approve")} /> : null}
            <span>{t("approve")}</span>
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => updateStatus("rejected")}
            className={`${adminUi.buttonDanger} ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {isBusy ? <Spinner size={16} label={t("reject")} /> : null}
            <span>{t("reject")}</span>
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => updateStatus("rejected")}
          className={`${adminUi.buttonDanger} ${isBusy ? "cursor-not-allowed opacity-70" : ""}`}
        >
          {isBusy ? <Spinner size={16} label={t("delete")} /> : null}
          <span>{t("delete")}</span>
        </button>
      )}
      <label className="flex w-full items-center gap-2 text-xs text-slate-600 lg:w-auto">
        <span>{t("roleLabel")}</span>
        <select
          value={nextRole}
          onChange={(event) => setNextRole(event.target.value as "superuser" | "author")}
          disabled={isBusy}
          className={`${adminUi.input} h-9 min-w-0 py-1 text-xs lg:min-w-[130px]`}
        >
          <option value="author">{t("author")}</option>
          <option value="superuser">{t("superuser")}</option>
        </select>
      </label>
      <button
        type="button"
        disabled={isBusy || nextRole === localRole}
        onClick={updateRole}
        className={`${adminUi.buttonPrimary} ${
          isBusy || nextRole === localRole
            ? "cursor-not-allowed opacity-70"
            : ""
        }`}
      >
        {isBusy ? <Spinner size={16} label={t("saveRole")} /> : null}
        <span>{t("saveRole")}</span>
      </button>
      {message ? <span className="text-xs text-rose-600">{message}</span> : null}
    </div>
  );
}
