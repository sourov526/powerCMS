import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, type AuthTokenPayload, verifyAuthToken } from "@/lib/auth/auth";
import { initCloudflareD1 } from "@/lib/db-cloudflare";
import { getUserById } from "@/lib/auth/users";

export type SessionUser = {
  id: number;
  email: string;
  role: AuthTokenPayload["role"];
  status: AuthTokenPayload["status"];
  authVersion: AuthTokenPayload["authVersion"];
};

export async function getSessionUser() {
  await initCloudflareD1();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyAuthToken(token);
  if (!payload) return null;
  const user = await getUserById(payload.userId);
  if (!user) return null;
  if (user.authVersion !== payload.authVersion) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    authVersion: user.authVersion,
  } as SessionUser;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

export function requireRole(user: SessionUser, allowed: SessionUser["role"][]) {
  if (!allowed.includes(user.role)) {
    redirect("/admin");
  }
}
