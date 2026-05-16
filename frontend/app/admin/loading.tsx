import { adminUi } from "@/app/admin/core/admin-ui";
import AnimatePulse from "@/components/atoms/AnimatePulse";
import LoadingOverlay from "@/components/atoms/LoadingOverlay";

export default function Loading() {
  return (
    <main className={adminUi.page}>
      <div className="space-y-6">
        <LoadingOverlay show label="Loading" />
        <div>
          <AnimatePulse heightClassName="h-8" className="max-w-sm" />
          <AnimatePulse heightClassName="h-4" className="mt-3 max-w-xl" />
        </div>

        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <AnimatePulse key={idx} heightClassName="h-24" />
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <AnimatePulse heightClassName="h-5" className="max-w-xs" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <AnimatePulse key={idx} heightClassName="h-10" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
