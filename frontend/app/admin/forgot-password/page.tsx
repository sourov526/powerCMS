import { getSessionUser } from "@/lib/auth/auth-server";
import { redirect } from "next/navigation";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user && user.status === "active") {
    redirect("/admin");
  }
  return <ForgotPasswordClient />;
}
