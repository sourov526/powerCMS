export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { deleteNotificationForUser } from "@/lib/services/notifications";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  const user = await getSessionUser();
  if (!user || (user.role !== "superuser" && user.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const resolved = await params;
  const id = Number(resolved?.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const deleted = await deleteNotificationForUser({
    id,
    userId: user.id,
    role: user.role,
  });
  if (!deleted) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
