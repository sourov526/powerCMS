import { notFound } from "next/navigation";
import PaginationNav from "@/app/admin/core/PaginationNav";
import { getPostsByTagSlug, getTagBySlug } from "@/lib/services/posts";
import { paginate, parsePage } from "@/lib/utils/pagination";
import { requireRole, requireSessionUser } from "@/lib/auth/auth-server";
import { adminUi } from "@/app/admin/core/admin-ui";
import { getScopedTranslations } from "@/utils/strings/server";
import { Link } from "@/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ page?: string }> };

export default async function TagPage({ params, searchParams }: Props) {
  const user = await requireSessionUser();
  requireRole(user, ["superuser"]);
  const t = await getScopedTranslations("Admin.tagDetail");
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();
  const posts = await getPostsByTagSlug(slug);
  const indexable = tag.count >= 2;
  const page = parsePage(resolvedSearchParams?.page);
  const { items, totalPages, page: safePage } = paginate(posts, page, 10);
  if (page > totalPages) {
    notFound();
  }

  return (
    <main className={adminUi.page}>
      <div>
        <h1 className={adminUi.title}>{tag.name}</h1>
        <p className={adminUi.subtitle}>{t("intro", { name: tag.name })}</p>
      </div>
      {!indexable ? (
        <p className={adminUi.alert}>{t("noindex")}</p>
      ) : null}

      <ul className={adminUi.list}>
        {items.map((post) => (
          <li key={post.slug}>
            <Link href={`/admin/posts/${encodeURIComponent(post.slug)}`} className={adminUi.link}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>

      <PaginationNav baseUrl={`/admin/tags/${slug}`} page={safePage} totalPages={totalPages} />
    </main>
  );
}
