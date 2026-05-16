"use client";

import AdminAuthShell from "@/components/admin/admin/AdminAuthShell";
import PasswordInput from "@/components/admin/auth/PasswordInput";
import { adminUi } from "@/app/admin/core/admin-ui";
import { Link } from "@/navigation";
import { mapAuthError } from "@/utils/strings/auth-errors";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Spinner from "@/components/atoms/Spinner";
import LoadingOverlay from "@/components/atoms/LoadingOverlay";

export default function LoginClient() {
  return (
    <Suspense
      fallback={
        <AdminAuthShell>
          <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <Spinner size={28} label="Loading" />
                <div className={adminUi.subtitle}>Loading...</div>
              </div>
            </div>
          </main>
        </AdminAuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const authErrorText: Record<string, string> = {
    generic: "Something went wrong. Please try again.",
    invalidOtp: "Invalid OTP or expired.",
    emailPasswordRequired: "Email and password are required.",
    invalidCredentials: "Invalid credentials.",
    accountInactive: "Your account is not active.",
    loginFailed: "Login temporarily unavailable.",
    unauthorized: "Unauthorized.",
    userNotFound: "User not found.",
  };
  const tErrors = (key: string) => authErrorText[key] ?? authErrorText.generic;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [step, setStep] = useState<"password" | "otp">("password");
  const [otp, setOtp] = useState("");
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(300);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const registered = searchParams.get("registered") === "1";
  const passwordReset = searchParams.get("passwordReset") === "1";

  async function readError(response: Response) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return mapAuthError(data?.error, tErrors);
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("admin_login_email");
      if (stored) {
        setEmail(stored);
        setRememberMe(true);
      }
    } catch {
      // ignore storage access
    }
  }, []);

  useEffect(() => {
    if (step !== "otp") return;
    setOtpSecondsLeft(300);
    const timer = window.setInterval(() => {
      setOtpSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setMessage(await readError(response));
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        requiresTwoFactor?: boolean;
      } | null;
      if (data?.requiresTwoFactor) {
        setStep("otp");
        return;
      }

      try {
        if (rememberMe) {
          window.localStorage.setItem("admin_login_email", email);
        } else {
          window.localStorage.removeItem("admin_login_email");
        }
      } catch {
        // ignore storage access
      }

      // Force a full navigation so the `/admin` layout is re-rendered with the new cookie.
      window.location.assign("/admin");
    } catch {
      setMessage(authErrorText.generic);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (otpSecondsLeft <= 0) {
      setMessage(tErrors("invalidOtp"));
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        setMessage(await readError(response));
        return;
      }

      try {
        if (rememberMe) {
          window.localStorage.setItem("admin_login_email", email);
        } else {
          window.localStorage.removeItem("admin_login_email");
        }
      } catch {
        // ignore storage access
      }

      // Force a full navigation so the `/admin` layout is re-rendered with the new cookie.
      window.location.assign("/admin");
    } catch {
      setMessage(authErrorText.generic);
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
            <h1 className={adminUi.title}>Admin Login</h1>
            <p className={adminUi.subtitle}>Sign in to continue to the admin panel.</p>
          </div>
          {step === "password" ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <label className="space-y-4">
                <span className={adminUi.label}>
                  Email
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
              <PasswordInput
                id="login-password"
                label="Password"
                value={password}
                onChange={setPassword}
                required
                autoComplete="current-password"
              />
              <label className="mt-1 flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                />
                Remember email
              </label>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className={`${adminUi.buttonPrimary} w-full ${busy ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {busy ? (
                    <>
                      <Spinner size={16} label="Signing in..." />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
              <div className="text-sm font-semibold text-rose-600">
                OTP expires in{" "}
                {String(Math.floor(otpSecondsLeft / 60)).padStart(2, "0")}:
                {String(otpSecondsLeft % 60).padStart(2, "0")}
              </div>
              <label className="space-y-4">
                <span className={adminUi.label}>
                  OTP Code
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
                      <Spinner size={16} label="Verifying..." />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify OTP</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {message ? (
            <p className="mt-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {message}
            </p>
          ) : null}

          {registered ? (
            <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Registration successful. Please sign in.
            </p>
          ) : null}

          {passwordReset ? (
            <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Password reset successful. Please sign in.
            </p>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 text-sm text-slate-600">
            <div>
              Need an account?{" "}
              <Link href="/admin/register" className={adminUi.linkStrong}>
                Register
              </Link>
            </div>
            <div>
              <Link href="/admin/forgot-password" className={adminUi.linkStrong}>
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </main>
    </AdminAuthShell>
  );
}
