"use client";

import { useEffect, useState } from "react";
import { useTranslations } from '@/utils/strings/client';
import { Link } from "@/navigation";
import { adminUi } from "@/app/admin/core/admin-ui";
import ChangePasswordCard from "@/app/admin/profile/ChangePasswordCard";
import { mapAuthError } from "@/utils/strings/auth-errors";

type ProfileUser = {
  email: string;
  name: string | null;
  role: "superuser" | "author";
  status: "active" | "pending" | "rejected";
  twoFactorEnabled: boolean;
};

export default function ProfileClient({ user }: { user: ProfileUser }) {
  const t = useTranslations("Profile");
  const tRole = useTranslations("Admin.roles");
  const tStatus = useTranslations("Admin.status");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(300);
  const tErrors = useTranslations("Auth.errors");

  useEffect(() => {
    if (!twoFactorOpen) return;
    setOtpSecondsLeft(300);
    const timer = window.setInterval(() => {
      setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [twoFactorOpen]);

  async function enableTwoFactor() {
    setTwoFactorBusy(true);
    setTwoFactorError("");
    setTwoFactorMessage("");
    const response = await fetch("/api/auth/2fa/enable", { method: "POST" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
      const error = typeof data?.error === "string" ? data.error : null;
      setTwoFactorError(mapAuthError(error, tErrors));
      setTwoFactorBusy(false);
      return;
    }
    const data = (await response.json().catch(() => null)) as { enabled?: boolean } | null;
    if (data?.enabled) {
      setTwoFactorEnabled(true);
      setTwoFactorOpen(false);
      setTwoFactorMessage(t("twoFactor.alreadyEnabled"));
    } else {
      setTwoFactorOpen(true);
      setTwoFactorMessage(t("twoFactor.otpSent"));
    }
    setTwoFactorBusy(false);
  }

  async function disableTwoFactor() {
    setTwoFactorBusy(true);
    setTwoFactorError("");
    setTwoFactorMessage("");
    const response = await fetch("/api/auth/2fa/disable", { method: "POST" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
      const error = typeof data?.error === "string" ? data.error : null;
      setTwoFactorError(mapAuthError(error, tErrors));
      setTwoFactorBusy(false);
      return;
    }
    setTwoFactorEnabled(false);
    setTwoFactorMessage(t("twoFactor.disabled"));
    setTwoFactorBusy(false);
  }

  async function verifyTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTwoFactorError("");
    setTwoFactorMessage("");

    if (otpSecondsLeft <= 0) {
      setTwoFactorError(tErrors("invalidOtp"));
      return;
    }

    setTwoFactorBusy(true);
    const response = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp: twoFactorOtp }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
      const error = typeof data?.error === "string" ? data.error : null;
      setTwoFactorError(mapAuthError(error, tErrors));
      setTwoFactorBusy(false);
      return;
    }
    setTwoFactorEnabled(true);
    setTwoFactorOpen(false);
    setTwoFactorOtp("");
    setTwoFactorMessage(t("twoFactor.enabled"));
    setTwoFactorBusy(false);
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className={adminUi.title}>{t("title")}</h1>
        <p className={adminUi.subtitle}>{t("subtitle")}</p>
      </div>

      <div className="grid gap-6">
        <section className={`${adminUi.card} ${adminUi.cardBody} space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-400">
                {t("summary")}
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {user.name ?? t("notSet")}
              </div>
              <div className="text-sm text-slate-500">{user.email}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/profile/edit" className={adminUi.buttonSecondary}>
                {t("editButton")}
              </Link>
              <button
                type="button"
                className={adminUi.buttonPrimary}
                onClick={() => setPasswordOpen(true)}
              >
                {t("password.cta")}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-400">
                {t("email")}
              </div>
              <div className="text-base font-semibold text-slate-900">{user.email}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-400">
                {t("name")}
              </div>
              <div className="text-base font-semibold text-slate-900">
                {user.name ?? t("notSet")}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-400">
                {t("role")}
              </div>
              <div className="text-base font-semibold text-slate-900">
                {tRole(user.role)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-400">
                {t("status")}
              </div>
              <div className="text-base font-semibold text-slate-900">
                {tStatus(user.status)}
              </div>
            </div>
          </div>
        </section>
        <section className={`${adminUi.card} ${adminUi.cardBody} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-400">
                {t("twoFactor.title")}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {twoFactorEnabled ? t("twoFactor.enabledLabel") : t("twoFactor.disabledLabel")}
              </div>
            </div>
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
              <button
                type="button"
                role="switch"
                aria-checked={twoFactorEnabled}
                disabled={twoFactorBusy}
                onClick={() => {
                  if (twoFactorEnabled) {
                    disableTwoFactor();
                    return;
                  }
                  enableTwoFactor();
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                  twoFactorEnabled
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-slate-300 bg-slate-200"
                } ${twoFactorBusy ? "opacity-70" : ""}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span>
                {twoFactorEnabled ? t("twoFactor.enabledButton") : t("twoFactor.enableButton")}
              </span>
            </label>
          </div>
          {twoFactorError ? (
            <p className={`${adminUi.danger} mt-2`}>{twoFactorError}</p>
          ) : null}
          {twoFactorMessage ? (
            <p className={`${adminUi.success} mt-2`}>{twoFactorMessage}</p>
          ) : null}
        </section>
      </div>

      {twoFactorOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
            <div>
              <h2 className={adminUi.sectionTitle}>{t("twoFactor.modalTitle")}</h2>
              <p className={adminUi.subtitle}>{t("twoFactor.modalSubtitle")}</p>
            </div>
            <form onSubmit={verifyTwoFactor} className="mt-5 grid gap-4">
              <div className="text-sm font-semibold text-rose-600">
                {t("twoFactor.otpExpires")}{" "}
                {String(Math.floor(otpSecondsLeft / 60)).padStart(2, "0")}:
                {String(otpSecondsLeft % 60).padStart(2, "0")}
              </div>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <span>
                  {t("twoFactor.otpLabel")}
                  <span className="ml-1 text-rose-600">*</span>
                </span>
                <input
                  type="text"
                  value={twoFactorOtp}
                  onChange={(event) => setTwoFactorOtp(event.target.value)}
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className={adminUi.input}
                />
              </label>
              <button
                type="submit"
                disabled={twoFactorBusy || otpSecondsLeft <= 0}
                className={`${adminUi.buttonPrimary} ${
                  twoFactorBusy ? "cursor-not-allowed opacity-70" : ""
                }`}
              >
                {twoFactorBusy ? t("twoFactor.verifying") : t("twoFactor.verify")}
              </button>
            </form>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTwoFactorOpen(false);
                  setTwoFactorOtp("");
                }}
                className={adminUi.buttonSecondary}
              >
                {t("twoFactor.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ChangePasswordCard
        email={user.email}
        open={passwordOpen}
        onCancel={() => setPasswordOpen(false)}
      />
    </section>
  );
}
