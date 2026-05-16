import { getUserById } from "@/lib/auth/users";
import ProfileClient from "@/app/admin/profile/ProfileClient";
import { requireSessionUser } from "@/lib/auth/auth-server";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const sessionUser = await requireSessionUser();
  const user = await getUserById(sessionUser.id);

  if (!user) {
    return null;
  }

  return (
    <ProfileClient
      user={{
        email: user.email,
        name: user.name,
        role: user.role as "superuser" | "author",
        status: user.status as "active" | "pending" | "rejected",
        twoFactorEnabled: user.twoFactorEnabled ?? false,
      }}
    />
  );
}
