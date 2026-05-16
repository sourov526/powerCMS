import { getScopedTranslations } from "@/utils/strings/server";
import { getUserById } from "@/lib/auth/users";
import EditProfileForm from "@/app/admin/profile/EditProfileForm";
import { requireSessionUser } from "@/lib/auth/auth-server";
import { adminUi } from "@/app/admin/core/admin-ui";
import { Link } from "@/navigation";

export const dynamic = "force-dynamic";

export default async function AdminEditProfilePage() {
  const sessionUser = await requireSessionUser();
  const t = await getScopedTranslations("Profile.edit");
  const user = await getUserById(sessionUser.id);

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className={adminUi.title}>{t("title")}</h1>
        <p className={adminUi.subtitle}>{t("subtitle")}</p>
      </div>
      <EditProfileForm initialName={user.name} email={user.email} />
      <p>
        <Link href="/admin/profile" className={adminUi.link}>
          {t("back")}
        </Link>
      </p>
    </section>
  );
}
