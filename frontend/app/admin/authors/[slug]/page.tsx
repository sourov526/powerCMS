import { notFound } from "next/navigation";
import PaginationNav from "@/app/admin/core/PaginationNav";
import { paginate, parsePage } from "@/lib/utils/pagination";
import { getAuthorBySlug, getPostsByAuthorSlug } from "@/lib/services/posts";
import { requireRole, requireSessionUser } from "@/lib/auth/auth-server";
import { adminUi } from "@/app/admin/core/admin-ui";
import { getScopedTranslations } from "@/utils/strings/server";
import { Link } from "@/navigation";
import { getLocale } from '@/utils/strings/server';

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ page?: string }> };

export default async function AuthorPage({ params, searchParams }: Props) {
  const user = await requireSessionUser();
  requireRole(user, ["superuser"]);
  const t = await getScopedTranslations("Admin.authorDetail");
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();
  const locale = await getLocale();
  const posts = await getPostsByAuthorSlug(slug, locale);
  const indexable = Boolean(author.bio) && posts.length >= 2;
  const page = parsePage(resolvedSearchParams?.page);
  const { items, totalPages, page: safePage } = paginate(posts, page, 10);
  if (page > totalPages) {
    notFound();
  }

  return (
    <main className={adminUi.page}>
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className={adminUi.title}>{author.name}</h1>
          <p className={adminUi.subtitle}>
            {author.bio ?? t("bioFallback")}
          </p>
        </div>
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

      <PaginationNav baseUrl={`/admin/authors/${slug}`} page={safePage} totalPages={totalPages} />
    </main>
  );
}
