import Link from "next/link";

export default function SectionHeading({
  eyebrow,
  title,
  ctaLabel,
  ctaHref,
}: {
  eyebrow?: string;
  title: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[12px] tracking-[0.18em] text-brand-green-dark">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[18px] md:text-[22px] font-semibold tracking-[0.06em] text-ink">
          {title}
        </h2>
      </div>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-md border border-brand-stone bg-white px-4 py-2 text-[12px] tracking-[0.10em] text-ink/70 transition hover:bg-brand-mist"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
