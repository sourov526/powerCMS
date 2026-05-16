export const runtime = "nodejs";
import { getSessionUser } from "@/lib/auth/auth-server";
import { getUserById, updateUserName } from "@/lib/auth/users";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await getUserById(sessionUser.id);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  });
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";

  await updateUserName(sessionUser.id, name ? name : null);

  return NextResponse.json({ ok: true });
}
