import { getSessionUser } from "@/lib/auth/auth-server";
import { redirect } from "next/navigation";
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user && user.status === "active") {
    redirect("/admin");
  }
  return <RegisterClient />;
}
