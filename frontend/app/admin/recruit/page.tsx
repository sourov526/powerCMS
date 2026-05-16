import { adminUi } from "@/app/admin/core/admin-ui";
import RecruitClient from "@/app/admin/recruit/RecruitClient";
import { requireRole, requireSessionUser } from "@/lib/auth/auth-server";
import { getScopedTranslations } from "@/utils/strings/server";
import { getAllRecruitPostsForAdmin } from "@/lib/services/recruit-posts";
import { Link } from "@/navigation";

export const dynamic = "force-dynamic";
export default async function RecruitPage() {
  const user = await requireSessionUser();
  requireRole(user, ["superuser", "author"]);
  const t = await getScopedTranslations("Admin.recruit");
  const recruitPosts = await getAllRecruitPostsForAdmin();

  return (
    <section className={adminUi.page}>
      <div className={adminUi.header}>
        <div>
          <h1 className={adminUi.title}>{t("title")}</h1>
          <p className={adminUi.subtitle}>{t("subtitle")}</p>
        </div>
        <Link href="/admin/editor/recruit" className={adminUi.buttonPrimary}>
          {t("newRecruit")}
        </Link>
      </div>
      <RecruitClient
        posts={recruitPosts}
        currentUser={{ id: user.id, role: user.role }}
      />
    </section>
  );
}
