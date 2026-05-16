import { adminUi } from "@/app/admin/core/admin-ui";
import { requireSessionUser } from "@/lib/auth/auth-server";
import { listNotificationsForUser } from "@/lib/services/notifications";
import { applyDraftOverlaysForAdmin } from "@/lib/services/post-drafts";
import {
  getAllCategories,
  getAllPostsForAdmin,
} from "@/lib/services/posts";
import { getAllRecruitPostsForAdmin } from "@/lib/services/recruit-posts";
import { Link } from "@/navigation";
import { getScopedTranslations } from "@/utils/strings/server";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireSessionUser();
  const t = await getScopedTranslations("Admin.dashboard");
  const tStatus = await getScopedTranslations("Admin.status");
  const tRole = await getScopedTranslations("Admin.roles");
  const allPosts = await applyDraftOverlaysForAdmin(
    await getAllPostsForAdmin()
  );
  const posts =
    user.role === "superuser"
      ? allPosts
      : allPosts.filter((post) => post.createdBy === user.id);
  const allRecruitPosts = await getAllRecruitPostsForAdmin();
  const recruitPosts =
    user.role === "superuser"
      ? allRecruitPosts
      : allRecruitPosts.filter((post) => post.createdBy === user.id);
  const categories = await getAllCategories();
  const recentPosts = posts.slice(0, 5);
  const recentRecruitPosts = recruitPosts.slice(0, 5);
  const recentCategories = categories.slice(0, 5);
  const notifications = await listNotificationsForUser({
    userId: user.id,
    role: user.role,
    limit: 5,
  });

  const categoryCount = categories.length;
  const recruitPublishedCount = recruitPosts.filter(
    (post) => post.status === "published"
  ).length;
  const recruitDraftCount = recruitPosts.filter(
    (post) => post.status === "draft"
  ).length;
  const recruitArchivedCount = recruitPosts.filter(
    (post) => post.status === "archived"
  ).length;

  const dashboardPosts = allPosts;
  const dashboardPublishedCount = dashboardPosts.filter(
    (post) => post.status === "published"
  ).length;
  const dashboardDraftCount = dashboardPosts.filter(
    (post) => post.status === "draft"
  ).length;

  return (
    <main className={adminUi.page}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6">
          <div>
            <h1 className={adminUi.title}>{t("title")}</h1>
            <p className={adminUi.subtitle}>
              {user.role === "superuser"
                ? t("subtitleAdmin")
                : t("subtitleAuthor")}
            </p>
            <p className="mt-2">
              <Link href="/admin/posts" className={adminUi.linkStrong}>
                {t("openPosts")}
              </Link>
            </p>
          </div>

          <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-emerald-700">
                {t("stats.published.label")}
              </div>
              <div className="mt-1.5 text-2xl font-semibold text-emerald-900 lg:text-[28px]">
                {dashboardPublishedCount}
              </div>
              <div className="mt-1 text-sm text-emerald-700">
                {t("stats.published.helper")}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-amber-700">
                {t("stats.drafts.label")}
              </div>
              <div className="mt-1.5 text-2xl font-semibold text-amber-900 lg:text-[28px]">
                {dashboardDraftCount}
              </div>
              <div className="mt-1 text-sm text-amber-700">
                {t("stats.drafts.helper")}
              </div>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-sky-700">
                {t("stats.categories.label")}
              </div>
              <div className="mt-1.5 text-2xl font-semibold text-sky-900 lg:text-[28px]">
                {categoryCount}
              </div>
              <div className="mt-1 text-sm text-sky-700">
                {t("stats.categories.helper")}
              </div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-violet-700">
                {t("stats.recruitPublished.label")}
              </div>
              <div className="mt-1.5 text-2xl font-semibold text-violet-900 lg:text-[28px]">
                {recruitPublishedCount}
              </div>
              <div className="mt-1 text-sm text-violet-700">
                {t("stats.recruitPublished.helper")}
              </div>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-rose-700">
                {t("stats.recruitDrafts.label")}
              </div>
              <div className="mt-1.5 text-2xl font-semibold text-rose-900 lg:text-[28px]">
                {recruitDraftCount}
              </div>
              <div className="mt-1 text-sm text-rose-700">
                {t("stats.recruitDrafts.helper")}
              </div>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-teal-700">
                {t("stats.recruitArchived.label")}
              </div>
              <div className="mt-1.5 text-2xl font-semibold text-teal-900 lg:text-[28px]">
                {recruitArchivedCount}
              </div>
              <div className="mt-1 text-sm text-teal-700">
                {t("stats.recruitArchived.helper")}
              </div>
            </div>
          </section>

        </div>

        <aside className="space-y-4">
          <section className={`${adminUi.card} ${adminUi.cardBody}`}>
            <h2 className={adminUi.sectionTitle}>{t("sidebar.signedIn")}</h2>
            <div className="mt-3 text-sm text-slate-700">{user.email}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className={`${adminUi.badge} ${adminUi.badgeMuted}`}>
                {tRole(user.role as "superuser" | "author")}
              </span>
              <span
                className={`${adminUi.badge} ${
                  user.status === "active"
                    ? adminUi.badgePublished
                    : user.status === "rejected"
                    ? adminUi.badgeDanger
                    : adminUi.badgeDraft
                }`}
              >
                {tStatus(user.status as "active" | "pending" | "rejected")}
              </span>
            </div>
          </section>

          <section className={`${adminUi.card} ${adminUi.cardBody}`}>
            <h2 className={adminUi.sectionTitle}>
              {t("sidebar.recentPosts.title")}
            </h2>
            {recentPosts.length === 0 ? (
              <div className={`${adminUi.empty} mt-3`}>
                {t("sidebar.recentPosts.empty")}
              </div>
            ) : (
              <ul className="mt-3 grid gap-3 text-sm text-slate-600">
                {recentPosts.map((post) => (
                  <li
                    key={`${post.id}-${post.locale}`}
                    className="flex flex-col gap-1"
                  >
                    {(() => {
                      const canEdit =
                        user.role === "superuser" || post.createdBy === user.id;
                      const href = canEdit
                        ? `/admin/editor?slug=${encodeURIComponent(
                            post.slug
                          )}&locale=${post.locale}`
                        : "/admin/posts";
                      return (
                        <Link
                          href={href}
                          className="font-semibold text-slate-900 hover:text-slate-700"
                        >
                          {post.title}
                        </Link>
                      );
                    })()}
                    <span className="text-xs text-slate-500">
                      {tStatus(
                        post.status as
                          | "draft"
                          | "published"
                          | "scheduled"
                          | "archived"
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${adminUi.card} ${adminUi.cardBody}`}>
            <h2 className={adminUi.sectionTitle}>
              {t("sidebar.recentRecruitPosts.title")}
            </h2>
            {recentRecruitPosts.length === 0 ? (
              <div className={`${adminUi.empty} mt-3`}>
                {t("sidebar.recentRecruitPosts.empty")}
              </div>
            ) : (
              <ul className="mt-3 grid gap-3 text-sm text-slate-600">
                {recentRecruitPosts.map((post) => {
                  const canEdit =
                    user.role === "superuser" || post.createdBy === user.id;
                  const href = canEdit
                    ? `/admin/editor/recruit?slug=${encodeURIComponent(
                        post.slug
                      )}`
                    : "/admin/recruit";
                  return (
                    <li key={post.id} className="flex flex-col gap-1">
                      <Link
                        href={href}
                        className="font-semibold text-slate-900 hover:text-slate-700"
                      >
                        {post.title}
                      </Link>
                      <span className="text-xs text-slate-500">
                        {tStatus(
                          post.status as
                            | "draft"
                            | "published"
                            | "scheduled"
                            | "archived"
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={`${adminUi.card} ${adminUi.cardBody}`}>
            <h2 className={adminUi.sectionTitle}>
              {t("sidebar.recentCategories.title")}
            </h2>
            {recentCategories.length === 0 ? (
              <div className={`${adminUi.empty} mt-3`}>
                {t("sidebar.recentCategories.empty")}
              </div>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                {recentCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/admin/categories/${category.slug}`}
                      className={adminUi.link}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${adminUi.card} ${adminUi.cardBody}`}>
            <h2 className={adminUi.sectionTitle}>
              {t("sidebar.recentNotifications.title")}
            </h2>
            {notifications.length === 0 ? (
              <div className={`${adminUi.empty} mt-3`}>
                {t("sidebar.recentNotifications.empty")}
              </div>
            ) : (
              <ul className="mt-3 grid gap-3 text-sm text-slate-600">
                {notifications.map((item) => (
                  <li key={item.id} className="flex flex-col gap-1">
                    <a
                      href={item.link ?? "#"}
                      className="font-semibold text-slate-900"
                    >
                      {item.title}
                    </a>
                    {item.message ? (
                      <span className="text-xs text-slate-500">
                        {item.message}
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
