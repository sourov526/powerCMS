export default function UnderDevelopment({
  title = "Under Development",
  description = "This page is under development.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
      <h1 className="text-[22px] md:text-[28px] font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-3 text-[13px] md:text-[14px] leading-relaxed text-ink/70 tracking-[0.04em]">
        {description}
      </p>
    </div>
  );
}
