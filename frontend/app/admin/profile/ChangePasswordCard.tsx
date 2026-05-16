"use client";

import { useEffect, useState } from "react";
import { useTranslations } from '@/utils/strings/client';
import { adminUi } from "@/app/admin/core/admin-ui";
import { mapAuthError } from "@/utils/strings/auth-errors";
import PasswordChecklist from "@/components/admin/auth/PasswordChecklist";
import PasswordInput from "@/components/admin/auth/PasswordInput";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, passwordMeetsRequirements } from "@/lib/auth/password";

export default function ChangePasswordCard({
  email,
  open,
  onCancel,
}: {
  email: string;
  open: boolean;
  onCancel: () => void;
}) {
  const t = useTranslations("Profile.password");
  const tErrors = useTranslations("Auth.errors");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(300);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function resetState() {
    setOtpRequested(false);
    setOtp("");
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setError("");
    setBusy(false);
    setOtpSecondsLeft(300);
  }

  async function requestOtp() {
    setBusy(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/change-password", { method: "POST" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
      const error = typeof data?.error === "string" ? data.error : null;
      setError(mapAuthError(error, tErrors));
      setBusy(false);
      return;
    }

    setOtpRequested(true);
    setMessage(t("otpSent"));
    setBusy(false);
  }

  useEffect(() => {
    if (!otpRequested) return;
    setOtpSecondsLeft(300);
    const timer = window.setInterval(() => {
      setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpRequested]);

  async function submitChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!currentPassword) {
      setError(tErrors("currentPasswordRequired"));
      return;
    }
    if (otpSecondsLeft <= 0) {
      setError(tErrors("invalidOtp"));
      return;
    }
    if (!passwordMeetsRequirements(password)) {
      setError(tErrors("passwordRequirements"));
      return;
    }
    if (password === currentPassword) {
      setError(tErrors("passwordUnchanged"));
      return;
    }
    if (password !== confirmPassword) {
      setError(tErrors("passwordMismatch"));
      return;
    }

    setBusy(true);
    const response = await fetch("/api/auth/change-password/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp, password, currentPassword }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
      const error = typeof data?.error === "string" ? data.error : null;
      setError(mapAuthError(error, tErrors));
      setBusy(false);
      return;
    }

    setMessage(t("success"));
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setOtpRequested(false);
    setBusy(false);
    setTimeout(() => {
      cancel();
    }, 900);
  }

  function cancel() {
    resetState();
    onCancel();
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative w-full max-w-lg overflow-visible rounded-2xl border border-[#e1dfdc] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
        <div>
          <h2 className={adminUi.sectionTitle}>{t("title")}</h2>
          <p className={adminUi.subtitle}>{t("subtitle", { email })}</p>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={requestOtp}
            disabled={busy || otpRequested}
            className={`${adminUi.buttonPrimary} ${
              busy || otpRequested ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {busy ? t("sending") : t("sendOtp")}
          </button>
        </div>
        {otpRequested ? (
          <form onSubmit={submitChange} className="mt-4 grid gap-5 overflow-visible">
            <div className="text-sm font-semibold text-rose-600">
              OTP expires in{" "}
              {String(Math.floor(otpSecondsLeft / 60)).padStart(2, "0")}:
              {String(otpSecondsLeft % 60).padStart(2, "0")}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>
                {t("otp")}
                <span className="ml-1 text-rose-600">*</span>
              </span>
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className={adminUi.input}
              />
            </label>
            <PasswordInput
              id="current-password"
              label={t("currentPassword")}
              value={currentPassword}
              onChange={setCurrentPassword}
              required
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              autoComplete="current-password"
              onFocus={() => setShowPasswordRules(true)}
              onBlur={() => setShowPasswordRules(false)}
            />
            <div className="space-y-4">
              <div className="relative">
                <PasswordInput
                  id="new-password"
                  label={t("newPassword")}
                  value={password}
                  onChange={setPassword}
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  autoComplete="new-password"
                  onFocus={() => setShowPasswordRules(true)}
                  onBlur={() => setShowPasswordRules(false)}
                />
                <div
                  className={`mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-md md:absolute md:right-full md:top-0 md:mr-4 md:mt-0 md:w-72 md:z-50 ${
                    showPasswordRules || password.length > 0
                      ? "block"
                      : "hidden"
                  }`}
                >
                  <PasswordChecklist password={password} />
                </div>
              </div>
              <PasswordInput
                id="confirm-password"
                label={t("confirmPassword")}
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                autoComplete="new-password"
                onFocus={() => setShowPasswordRules(true)}
                onBlur={() => setShowPasswordRules(false)}
              />
            </div>
            <button
              type="submit"
              disabled={busy || otpSecondsLeft <= 0}
              className={`${adminUi.buttonPrimary} ${busy ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {busy ? t("updating") : t("update")}
            </button>
          </form>
        ) : null}
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={cancel}
            className={`${adminUi.buttonSecondary} ${busy ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
