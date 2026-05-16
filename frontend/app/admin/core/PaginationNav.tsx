import { adminUi } from "@/app/admin/core/admin-ui";
import { getScopedTranslations } from "@/utils/strings/server";
import { Link } from "@/navigation";

type Props = {
  baseUrl: string;
  page: number;
  totalPages: number;
};

export default async function PaginationNav({
  baseUrl,
  page,
  totalPages,
}: Props) {
  if (totalPages <= 1) return null;
  const t = await getScopedTranslations("Admin.pagination");

  const prevUrl = page > 1 ? `${baseUrl}?page=${page - 1}` : null;
  const nextUrl = page < totalPages ? `${baseUrl}?page=${page + 1}` : null;

  return (
    <nav
      aria-label={t("ariaLabel")}
      className="mt-5 flex flex-wrap items-center gap-3 text-sm"
    >
      {prevUrl ? (
        <Link href={prevUrl} className={adminUi.buttonSecondary}>
          <span>←</span>
          {t("previous")}
        </Link>
      ) : (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400">
          ← {t("previous")}
        </span>
      )}
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {t("page", { page, total: totalPages })}
      </span>
      {nextUrl ? (
        <Link href={nextUrl} className={adminUi.buttonSecondary}>
          {t("next")}
          <span>→</span>
        </Link>
      ) : (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400">
          {t("next")} →
        </span>
      )}
    </nav>
  );
}
