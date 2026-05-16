import { getSessionUser } from "@/lib/auth/auth-server";
import { redirect } from "next/navigation";
import ResetPasswordClient from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  if (user && user.status === "active") {
    redirect("/admin");
  }
  return <ResetPasswordClient />;
}
