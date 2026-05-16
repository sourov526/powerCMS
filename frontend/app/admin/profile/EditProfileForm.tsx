"use client";

import { useState } from "react";
import { useTranslations } from '@/utils/strings/client';
import { useRouter } from "@/navigation";
import { adminUi } from "@/app/admin/core/admin-ui";

export default function EditProfileForm({
  initialName,
  email,
}: {
  initialName: string | null;
  email: string;
}) {
  const router = useRouter();
  const t = useTranslations("Profile.edit.form");
  const [name, setName] = useState(initialName ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
      const error = typeof data?.error === "string" ? data.error : null;
      setError(error ?? t("errors.update"));
      setBusy(false);
      return;
    }

    setMessage(t("success"));
    setBusy(false);
    router.push("/admin/profile");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        {t("email")}
        <input type="email" value={email} disabled className={`${adminUi.input} opacity-70`} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        {t("name")}
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("namePlaceholder")}
          className={adminUi.input}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className={`${adminUi.buttonPrimary} ${busy ? "cursor-not-allowed opacity-70" : ""}`}
      >
        {busy ? t("saving") : t("save")}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
    </form>
  );
}
