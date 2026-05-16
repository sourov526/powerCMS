export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import {
  countUnreadNotificationsForUser,
  listNotificationsForUser,
} from "@/lib/services/notifications";

export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser({ userId: user.id, role: user.role }),
    countUnreadNotificationsForUser({ userId: user.id, role: user.role }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
