"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "@/utils/strings/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/navigation";
import { mapAuthError } from "@/utils/strings/auth-errors";
import AdminAuthShell from "@/components/admin/admin/AdminAuthShell";
import { adminUi } from "@/app/admin/core/admin-ui";
import Spinner from "@/components/atoms/Spinner";
import LoadingOverlay from "@/components/atoms/LoadingOverlay";
import PasswordChecklist from "@/components/admin/auth/PasswordChecklist";
import PasswordInput from "@/components/admin/auth/PasswordInput";
import {
  PASSWORD_MAX_LENGTH,
  passwordMeetsRequirements,
} from "@/lib/auth/password";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Auth.reset");
  const tErrors = useTranslations("Auth.errors");
  const [step, setStep] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(300);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function readError(response: Response) {
    const data = await response.json().catch(() => null);
    const errorMessage =
      data && typeof data === "object" && "error" in data
        ? String((data as { error?: unknown }).error ?? "")
        : undefined;
    return mapAuthError(errorMessage, tErrors);
  }

  useEffect(() => {
    const initialEmail = searchParams.get("email") ?? "";
    if (initialEmail) setEmail(initialEmail);
  }, [searchParams]);

  useEffect(() => {
    setOtpSecondsLeft(300);
    const timer = window.setInterval(() => {
      setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    if (!email) {
      setError(tErrors("invalidEmail"));
      setBusy(false);
      return;
    }

    if (otpSecondsLeft <= 0) {
      setError(tErrors("invalidOtp"));
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        setError(await readError(response));
        return;
      }

      setStep("password");
      setMessage(t("otpVerified"));
    } catch {
      setError(tErrors("generic"));
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    if (!passwordMeetsRequirements(password)) {
      setError(tErrors("passwordRequirements"));
      setBusy(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(tErrors("passwordMismatch"));
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });

      if (!response.ok) {
        setError(await readError(response));
        return;
      }

      router.push("/admin/login?passwordReset=1");
    } catch {
      setError(tErrors("generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminAuthShell>
      <LoadingOverlay show={busy} label="Loading" />
      <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-2">
            <h1 className={adminUi.title}>{t("title")}</h1>
            <p className={adminUi.subtitle}>
              {step === "otp" ? t("subtitleOtp") : t("subtitlePassword")}
            </p>
          </div>

          {step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
              <label className="space-y-4">
                <span className={adminUi.label}>
                  {t("emailLabel")}
                  <span className="ml-1 text-rose-500">*</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className={adminUi.input}
                />
              </label>
              <div className="text-sm font-semibold text-rose-600">
                {t("otpExpires")}{" "}
                {String(Math.floor(otpSecondsLeft / 60)).padStart(2, "0")}:
                {String(otpSecondsLeft % 60).padStart(2, "0")}
              </div>
              <label className="space-y-4">
                <span className={adminUi.label}>
                  {t("otpLabel")}
                  <span className="ml-1 text-rose-500">*</span>
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
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className={`${adminUi.buttonPrimary} w-full ${busy ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {busy ? (
                    <>
                      <Spinner size={16} label={t("verifying")} />
                      <span>{t("verifying")}</span>
                    </>
                  ) : (
                    <span>{t("verify")}</span>
                  )}
                </button>
              </div>
              {error ? <p className={`${adminUi.danger} mt-4`}>{error}</p> : null}
              {message ? (
                <p className={`${adminUi.success} mt-4`}>{message}</p>
              ) : null}
              <p className="mt-6 text-sm text-slate-600">
                {t("needNewOtp")}{" "}
                <Link
                  href="/admin/forgot-password"
                  className={adminUi.linkStrong}
                >
                  {t("sendAgain")}
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
              <PasswordInput
                id="reset-password"
                label={t("newPasswordLabel")}
                value={password}
                onChange={(next) => {
                  setPassword(next);
                  setShowPasswordRules(true);
                }}
                required
                autoComplete="new-password"
                maxLength={PASSWORD_MAX_LENGTH}
              />
              <PasswordInput
                id="reset-confirm-password"
                label={t("confirmPasswordLabel")}
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                autoComplete="new-password"
                maxLength={PASSWORD_MAX_LENGTH}
              />
              {showPasswordRules ? (
                <PasswordChecklist password={password} />
              ) : null}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className={`${adminUi.buttonPrimary} w-full ${busy ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {busy ? (
                    <>
                      <Spinner size={16} label={t("updating")} />
                      <span>{t("updating")}</span>
                    </>
                  ) : (
                    <span>{t("submit")}</span>
                  )}
                </button>
              </div>
              {error ? <p className={`${adminUi.danger} mt-4`}>{error}</p> : null}
              {message ? (
                <p className={`${adminUi.success} mt-4`}>{message}</p>
              ) : null}
            </form>
          )}

          <div className="mt-7 text-sm text-slate-600">
            <Link href="/admin/login" className={adminUi.linkStrong}>
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </main>
    </AdminAuthShell>
  );
}

export default function ResetPasswordClient() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordLoading() {
  const t = useTranslations("Auth.reset");

  return (
    <AdminAuthShell>
      <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className={adminUi.title}>{t("title")}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Spinner size={26} label={t("loading")} />
            <p className={adminUi.subtitle}>{t("loading")}</p>
          </div>
        </div>
      </main>
    </AdminAuthShell>
  );
}
