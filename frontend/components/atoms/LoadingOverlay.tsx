"use client";

import Spinner from "@/components/atoms/Spinner";

export default function LoadingOverlay({
  show,
  label = "Loading",
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-brand-offwhite/75 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="rounded-2xl border border-ink/15 bg-white/80 px-6 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
        <Spinner size={44} label={label} />
      </div>
    </div>
  );
}
