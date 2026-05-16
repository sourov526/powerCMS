import { getSessionUser } from "@/lib/auth/auth-server";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user && user.status === "active") {
    redirect("/admin");
  }
  return <LoginClient />;
}
