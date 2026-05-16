export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { markAllNotificationsReadForUser } from "@/lib/services/notifications";

export async function POST() {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await markAllNotificationsReadForUser({ userId: user.id, role: user.role });
  return NextResponse.json({ ok: true });
}
