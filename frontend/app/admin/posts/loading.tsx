import AnimatePulse from "@/components/atoms/AnimatePulse";
import LoadingOverlay from "@/components/atoms/LoadingOverlay";
import { adminUi } from "@/app/admin/core/admin-ui";

export default function Loading() {
  return (
    <section className={adminUi.page}>
      <LoadingOverlay show label="Loading" />
      <div className={adminUi.header}>
        <div>
          <AnimatePulse heightClassName="h-8" className="max-w-sm" />
          <AnimatePulse heightClassName="h-4" className="mt-3 max-w-xl" />
        </div>
        <AnimatePulse heightClassName="h-10" className="w-40" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, idx) => (
            <AnimatePulse key={idx} heightClassName="h-12" />
          ))}
        </div>
      </div>
    </section>
  );
}
