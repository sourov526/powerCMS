"use client";

import { useState } from "react";
import { useTranslations } from "@/utils/strings/client";
import { useRouter } from "next/navigation";
import { Link } from "@/navigation";
import { mapAuthError } from "@/utils/strings/auth-errors";
import AdminAuthShell from "@/components/admin/admin/AdminAuthShell";
import { adminUi } from "@/app/admin/core/admin-ui";
import Spinner from "@/components/atoms/Spinner";
import LoadingOverlay from "@/components/atoms/LoadingOverlay";

export default function ForgotPasswordClient() {
  const router = useRouter();
  const t = useTranslations("Auth.forgot");
  const tErrors = useTranslations("Auth.errors");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function readError(response: Response) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    return mapAuthError(data?.error, tErrors);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError(await readError(response));
        return;
      }

      setMessage(t("success"));
      router.push(`/admin/reset-password?email=${encodeURIComponent(email)}`);
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
            <p className={adminUi.subtitle}>{t("subtitle")}</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className={`${adminUi.buttonPrimary} w-full ${busy ? "cursor-not-allowed opacity-70" : ""}`}
              >
                {busy ? (
                  <>
                    <Spinner size={16} label={t("submitting")} />
                    <span>{t("submitting")}</span>
                  </>
                ) : (
                  <span>{t("submit")}</span>
                )}
              </button>
            </div>
          </form>

          {error ? (
            <p className="mt-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <div className="mt-7 text-sm text-slate-600">
            {t("remembered")}{" "}
            <Link href="/admin/login" className={adminUi.linkStrong}>
              {t("signInLink")}
            </Link>
          </div>
        </div>
      </main>
    </AdminAuthShell>
  );
}
