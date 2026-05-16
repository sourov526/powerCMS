import { getScopedTranslations } from "@/utils/strings/server";
import { requireRole, requireSessionUser } from "@/lib/auth/auth-server";
import { listUsers } from "@/lib/auth/users";
import { adminUi } from "@/app/admin/core/admin-ui";
import UsersClient from "@/app/admin/users/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await requireSessionUser();
  requireRole(user, ["superuser"]);
  const t = await getScopedTranslations("Admin.users");
  const users = await listUsers();

  return (
    <section className={adminUi.page}>
      <div>
        <h1 className={adminUi.title}>{t("title")}</h1>
        <p className={adminUi.subtitle}>{t("subtitle")}</p>
      </div>
      <UsersClient users={users} />
    </section>
  );
}
