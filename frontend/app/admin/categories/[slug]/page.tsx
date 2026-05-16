import { notFound } from "next/navigation";
import PaginationNav from "@/app/admin/core/PaginationNav";
import { paginate, parsePage } from "@/lib/utils/pagination";
import { getCategoryBySlug, getPostsByCategorySlug } from "@/lib/services/posts";
import { requireRole, requireSessionUser } from "@/lib/auth/auth-server";
import { adminUi } from "@/app/admin/core/admin-ui";
import { getScopedTranslations } from "@/utils/strings/server";
import { getLocale } from '@/utils/strings/server';
import { locales } from '@/utils/strings/config';

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ page?: string }> };

export default async function CategoryPage({ params, searchParams }: Props) {
  const user = await requireSessionUser();
  requireRole(user, ["superuser"]);
  const t = await getScopedTranslations("Admin.categoryDetail");
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const locale = await getLocale();
  const postsByLocale = await Promise.all(
    locales.map((entry) => getPostsByCategorySlug(slug, entry))
  );
  const posts = postsByLocale
    .flat()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const page = parsePage(resolvedSearchParams?.page);
  const { items, totalPages, page: safePage } = paginate(posts, page, 10);
  if (page > totalPages) {
    notFound();
  }

  return (
    <main className={adminUi.page}>
      <div>
        <h1 className={adminUi.title}>{category.name}</h1>
        {category.intro ? (
          <p className={adminUi.subtitle}>{category.intro}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                {t("table.title")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                {t("table.slug")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                {t("table.updatedAt")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length > 0 ? (
              items.map((post) => (
                <tr key={`${post.id}-${post.slug}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    <a
                      href={`/${locale}/${encodeURIComponent(post.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {post.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{post.slug}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(post.updatedAt).toLocaleString(locale === "ja" ? "ja-JP" : "en-US")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                  {t("table.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationNav baseUrl={`/admin/categories/${slug}`} page={safePage} totalPages={totalPages} />
    </main>
  );
}
