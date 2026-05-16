"use client";

export default function Spinner({
  className,
  size = 32,
  label = "Loading",
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  const px = Math.max(12, Math.floor(size));
  const border = Math.max(2, Math.round(px / 8));

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={["inline-flex items-center justify-center", className ?? ""].join(
        " "
      )}
    >
      <span
        className="animate-spin rounded-full border-solid border-brand-green/25 border-t-brand-green"
        style={{ width: px, height: px, borderWidth: border }}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
