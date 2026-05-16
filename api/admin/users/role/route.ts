export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-server";
import { getUserById, updateUserRole } from "@/lib/auth/users";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "superuser") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: unknown; role?: unknown }
    | null;
  const id = Number(body?.id);
  const role = body?.role === "superuser" || body?.role === "author" ? body.role : null;
  if (!id || !role) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (id === user.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  const target = await getUserById(id);
  if (!target) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const updated = await updateUserRole(id, role);
  if (!updated) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, role: updated.role });
}
