"use client";

import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

type Props = {
  password: string;
};

export default function PasswordChecklist({ password }: Props) {
  const checks = [
    { label: `${PASSWORD_MIN_LENGTH}+ characters`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
  ];

  return (
    <ul className="space-y-1 text-xs text-slate-600">
      {checks.map((check) => (
        <li key={check.label} className={check.ok ? "text-emerald-700" : "text-slate-500"}>
          {check.ok ? "OK" : "-"} {check.label}
        </li>
      ))}
    </ul>
  );
}
