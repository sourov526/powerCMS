export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { deleteUserById, updateUserStatus } from "@/lib/auth/users";
import { createNotification } from "@/lib/services/notifications";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "superuser") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: unknown; status?: unknown }
    | null;
  const id = Number(body?.id);
  const status = body?.status === "active" || body?.status === "rejected" ? body.status : null;
  if (!id || !status) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (status === "rejected") {
    await deleteUserById(id);
    return NextResponse.json({ ok: true, removed: true });
  }

  const updated = await updateUserStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (status === "active") {
    await createNotification({
      type: "user_approved",
      title: "User approved",
      message: updated.email,
      link: "/admin/users",
      recipientRole: "superuser",
      actorId: user.id,
    });
  }
  return NextResponse.json({ ok: true });
}
