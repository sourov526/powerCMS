"use client";

import { adminUi } from "@/app/admin/core/admin-ui";
import { useState } from "react";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
};

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  required,
  autoComplete,
  minLength,
  maxLength,
  onFocus,
  onBlur,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <label className="space-y-4">
      <span className={adminUi.label}>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`${adminUi.input} pr-20`}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}
